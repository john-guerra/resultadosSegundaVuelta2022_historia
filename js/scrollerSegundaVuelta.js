/* global d3, topojson, stackedBar */

function scrollerSegundaVuelta(segundaVuelta, mapData, regionesDane) {
  let margin = { left: 20, top: 20, right:20, bottom: 20},
    dRegiones = {},
    dFeatures = {},
    regiones,
    r = 50,
    defaultR = 3,
    collisionFactor = 1.1,
    forceToCentroid = 0.3,
    showMap = false,
    byCities = false, // Draw the cities borders
    collision = false,
    useShades = false,
    height = 800,
    width = 600,
    maxPct = 0.8,
    color = getColorScale(),
    size = d3.scalePow()
      .exponent(0.5)
      .range([1,r]),
    x = d3.scaleLinear()
      .domain([-1, 1])
      .range([0, width]),
    y = d3.scaleBand()
      .range([height-100, 100]),
    yPopulation = d3.scalePow()
      .exponent(0.5)
      .range([height-100, 100]),
    yToCenter = false,
    xToCenter = false,
    yByPopulation = false, // y axis by population or by region ?
    choroplet = false,
    showCircles = false,
    useSize = false,
    circlesByGeo = true,
    circlesDancing = false,
    land,
    landState,
    pathCanvas,
    simulation,
    segundaVueltaNest,
    contextBg,
    contextFg,
    selected = null,
    titleImage = new Image(),
    fmtPct = d3.format(" >5.2%"),
    fmt = d3.format(" >5.2s");
    // stillWantTitle = false;




    // path2D = new Path2D();


  // https://stackoverflow.com/questions/15661339/how-do-i-fix-blurry-text-in-my-html5-canvas
  function getPixelRatio() {
    var ctx = document.createElement("canvas").getContext("2d"),
      dpr = window.devicePixelRatio || 1,
      bsr = ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1;
    return dpr / bsr;
  }

  function getColorScale() {
    let c;
    if (useShades) {
      c = d3.scaleSequential(d3.interpolatePuOr)
        .domain([-maxPct, maxPct]);
    } else {
      c = d3.scaleThreshold()
        .domain([0])
        .range([d3.schemePuOr[9][1],d3.schemePuOr[9][7]]);
    }
    return c;
  }

  function computeRegions() {
    dRegiones={};
    regionesDane.forEach(d => {
      dRegiones[+d["CÓDIGO DANE DEL MUNICIPIO"]] = d.REGION;
    });
    dRegiones[0] = "Consulados";
    regiones = d3.set(d3.values(dRegiones)).values();
  }



  function setupGeo() {

    land = topojson.feature(mapData, {
      type: "GeometryCollection",
      geometries: mapData.objects.mpios.geometries
    });
    landState = topojson.feature(mapData, {
      type: "GeometryCollection",
      geometries: mapData.objects.depts.geometries
    });
    pathCanvas = d3.geoPath()
      .projection(d3.geoTransverseMercator()
        .rotate([74 + 30 / 60, -38 - 50 / 60])
        .fitExtent([[margin.left-(width<700 ?50 : 100), margin.top], [width-margin.right, height-margin.bottom]], landState));

    dFeatures = {};
    land.features.forEach( d => {
      dFeatures[+d.id] = d;
    });
    landState.features.forEach( d => {
      dFeatures[d.properties.dpt] = d;
    });

  }

  function doColorLegend() {
    const svg = d3.select(DOM.svg(width, 60));


    var legendLinear = d3.legendColor()
      .shapeWidth(width/8)
      .cells(7)
      .orient("horizontal")
      .title("Difference")
      .labels([
        " 100.00% Hacia Hernández",
        "  66.67%",
        "  33.33%",
        "   0.00%",
        "  33.33%",
        "  66.67%",
        " 100.00% Hacia Petro",
      ].reverse())
      .labelFormat(fmtPct)
      .ascending(false)
      .labelAlign("end")
      .scale(color);
  }

  function doSizeLegend() {
    const svg = d3.select(DOM.svg(width, size(4000000)*2 + 50));
    // const   = d3.format(" >5.2s");

    var legend = d3.legendSize()
      .shapePadding(width/5- size(4000000))
      .orient("horizontal")
      .shape("circle")
      .labelFormat(fmt)
      .title("Votantes por ciudad")
      .scale(size);
    let g = svg.append("g")
      .attr("transform", "translate(50,20)");
    g.call(legend);
    g.selectAll(".label")
      .style("font", "10pt sans-serif");
    g.selectAll(".swatch")
      .style("fill", color(0));
  }

  function chart(selection) {

    // width = selection.node().offsetWidth - parseInt(parseInt(d3.select("#sections").style("width"), 10));
    width = parseInt(parseInt(d3.select("#visFiller").style("width"), 10));
    height = parseInt(parseInt(d3.select("#vis").style("height"), 10));

    init();

    console.log(width, height);
    // height = selection.node().offsetHeight;

    size.domain([0, d3.max(segundaVuelta, d=> d.votant)])
      .range([1,r]);
    x.range([0, width]);
    y.domain(regiones)
      .range([height-50, 50]);
    yPopulation.domain(size.domain())
      .range([height-50, 50]);



    function createCanvasContext(className) {
      let canvasSel = selection.selectAll("." + className).data([segundaVuelta]);
      canvasSel = canvasSel.enter().append("canvas").attr("class", className).merge(canvasSel);

      const context = canvasSel.node().getContext("2d");

      const ratio = getPixelRatio();
      console.log("pixelRatio", ratio);
      canvasSel.node().width = width * ratio;
      canvasSel.node().height = height * ratio;
      canvasSel.style("width", width + "px");
      canvasSel.style("height", height + "px");
      canvasSel.style("position", "absolute");
      canvasSel.style("top", "0px");
      canvasSel.style("left", "0px");
      // canvasSel.attr("width", width + "px");
      // canvasSel.attr("height", height + "px");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      return context;
    }

    contextBg = createCanvasContext("bg");
    contextFg = createCanvasContext("fg");

    segundaVuelta.forEach(d => {
      d.centroid = d.feat && d.dpto.toUpperCase() !== "CONSULADOS" ?
        pathCanvas.centroid(d.feat) :
        [width/6*5, height/8*2];
      d.xPct = x(d.pct);
      d.yRegion = y(d.region)+y.bandwidth()/2;
      d.yPopulation = yPopulation(+d.votant);
    });


    selected = null;

    // path2D = new Path2D();
    // if (showMap) {
    //   pathCanvas
    //     // .context(path2D)(byCities ? land : landState);
    // }


    // redrawMap();

    simulation = d3.forceSimulation(segundaVuelta).stop();

    resetForces();

    simulation
      .on("tick", ticked);
    // scramble();


    // setTimeout(() => segundaVuelta.forEach( n => {
    //   simulation.alpha(0.9).restart();scramble(); }) , 1000);

    d3.select(contextFg.canvas)
      .on("mouseout", () => {
        selected = null;
        d3.select("#vTooltip")
          .style("display", "none");
      })
      .on("click", onHighlight)
      .on("mousemove", onHighlight);

    function onHighlight() {
      if (!showCircles) return;
      selected = simulation.find(d3.event.offsetX, d3.event.offsetY);
      ticked();
      // console.log("xy",d3.event, d3.event.offsetX, d3.event.offsetY);
      console.log(selected);
      console.log(selected.pct);

      // d3.select(contextFg.canvas)
      //   .attr("data-toggle", "tooltip")
      //   .attr("data-placement", "left")
      //   .attr("title", selected.pct);

      d3.select("#vTooltip")
        .style("display", "block")
        // .style("top", d3.event.screenX + "px")
        // .style("left", d3.event.screenY + "px")
        .select("p")
        .html("Diferencia: " + fmtPct(Math.abs(selected.pct)) +
          " a favor de " + ( selected.pct > 0 ?  " Hernández " : " Petro ") + "<br>" +
          "Total Votantes:" + fmt(selected.votant));

      d3.select("#vTooltip")
        .select("h3")
        .text(selected.mun + ", " + selected.dpto);


      let bar = stackedBar()
        .keys(["RODOLFO_HERNÁNDEZ_vot_result", "votbla result","nulos_no_marcados", "GUSTAVO_PETRO_vot_result" ]);

      d3.select("#barChart")
        .datum(selected)
        .call(bar);
    }

    // contextFg.globalCompositeOperation = "darken";

    function ticked() {
      // contextFg.globalAlpha = 1;
      contextFg.clearRect(0, 0, width, height);

      if (showCircles) {
        drawNodes();
      }
    } //ticked

    function drawNodes() {
      contextFg.save();
      for (const n of segundaVuelta) {
        let nr = useSize ? size(n.votant) : defaultR;


        contextFg.fillStyle=color(n.pct);
        contextFg.beginPath();
        contextFg.arc(n.x, n.y, nr, 0, 2 * Math.PI);
        if ( selected && selected.dpto !== n.dpto) {
          contextFg.globalAlpha = 0.3;
        } else {
          contextFg.globalAlpha = 1;
        }

        contextFg.fill();
        if (n === selected) {
          contextFg.strokeStyle="orange";
          contextFg.stroke();

        }



      }
      // if (selected) {

      //   contextFg.lineWidth = 2;
      //   contextFg.beginPath();
      //   contextFg.arc(selected.x, selected.y, useSize ? size(selected.votant) : defaultR, 0, 2 * Math.PI);
      //   contextFg.stroke();
      //   contextFg.fillStyle="#777";
      //   contextFg.textAlign="center";
      //   contextFg.fillText(selected.mun, selected.x, selected.y+2);
      // }
      // Draw Labels

      for (const n of segundaVuelta) {
        let nr = useSize ? size(n.votant) : defaultR;
        if (!circlesDancing && nr>9 || n === selected) {
          contextFg.fillStyle=  n.pct<0 ? "#a14" : "#024D59";
          contextFg.textAlign="center";
          contextFg.fillText(n.mun, n.x, n.y+2);
        }
      }

      if (circlesByGeo) {
        contextFg.fillStyle="#777";
        contextFg.fillText("Consulados", width/6*5 -30, height/8*2 - 40);
      } else {
        if (!yByPopulation && !yToCenter) {
          regiones.forEach(r => {
            contextFg.fillStyle="#777";
            contextFg.fillText(r, 50, y(r));
          });
        }
      }


      contextFg.restore();
    }  // drawNodes


  }// chart

  function scramble()  {
    segundaVuelta.forEach(n => {
      n.x=Math.random()*width; n.y=0;
    });
  }

  function setNodesToMap()  {
    segundaVuelta.forEach(n => {
      n.x=n.centroid[0];
      n.y=n.centroid[1];
    });
  }


  function redrawMap() {
    contextBg.clearRect(0, 0, width, height);
    if (showMap) {
      pathCanvas.context(contextBg);

      // let features = byCities ? landState : land;
      contextFg.lineWidth = 1;
      // contextFg.globalAlpha = 0.3;

      if (byCities) {
        drawCities();
      }

      drawStates();
      // contextFg.save();
      // contextFg.restore();
    }
  }

  function drawStates() {
    segundaVueltaNest.forEach(d => {
      contextBg.beginPath();
      contextBg.strokeStyle = "#555";
      contextBg.fillStyle = color(d.value);
      pathCanvas(dFeatures[ d.key.toUpperCase()]);
      if (choroplet && !byCities) {
        contextBg.fill();
      }
      contextBg.stroke();
    });
  }

  function drawCities() {
    contextBg.lineWidth=0.5;
    segundaVuelta.forEach(d => {
      contextBg.beginPath();
      contextBg.strokeStyle = "#ccc";
      contextBg.fillStyle = color(d.pct);
      pathCanvas(d.feat);
      if (choroplet) {
        contextBg.fill();
      }
      contextBg.stroke();
    });

  }

  function drawTitle() {
    console.log("drawTitle");
    titleImage.src = "./img/title.png";

    // stillWantTitle = true;

    function drawImage() {
      // if (!stillWantTitle) return;

      contextBg.clearRect(0, 0, width, height);
      contextBg.drawImage(document.getElementById("imgTitle"), 0, height/2 - 150, width, width*0.42);
    }

    // if (titleImage.data) {
    drawImage();
    // }
    // titleImage.onload = function (error) {
    //   console.log("done loading image!");
    //   console.log(error);
    //   titleImage.data = this;

    //   drawImage();
    // };


  }



  function resetForces(restart) {
    const forceX = d3.forceX(d=> xToCenter ?
        width/2 :
        circlesByGeo ?
          d.centroid[0] :
          d.xPct
      ).strength(xToCenter ? 0.1: forceToCentroid),
      forceY = d3.forceY( d=> yToCenter ?
        height/2 :
        circlesByGeo ?
          d.centroid[1] :
          yByPopulation ?
            d.yPopulation :
            d.yRegion
      ).strength(yToCenter ? 0.1: forceToCentroid);


    simulation
      .velocityDecay( circlesDancing ? 0.05 : 0.4) // how fast they converge
      .force("x", forceX)
      .force("y", circlesDancing ?  null : forceY)
      .force("boundary", circlesDancing ?
        d3.forceBoundary(0,  0, width, width<700 ? height*6/8: height):
        null
      )
      // .force("charge", circlesDancing ?
      //   d3.forceManyBody().distanceMax(20) :
      //   null
      // )
      .force("collide", collision ?
        d3.forceCollide(d => (useSize ?
          size(d.votant) :
          defaultR)*collisionFactor
        ).iterations(4):
        ()=>{} ); // no collision

    restart = restart!==undefined ? restart : true;
    if (restart===true) simulation.alpha(0.7);
  }



  function init() {

    setupGeo();
    computeRegions();

    segundaVuelta.forEach( d=> {
      d.votant = +d.votant;
      d.dane = +d.dane;
      d["RODOLFO_HERNÁNDEZ_vot"] = +d["RODOLFO_HERNÁNDEZ_vot"];
      d["GUSTAVO_PETRO_vot"] = +d["GUSTAVO_PETRO_vot"];
      d["RODOLFO_HERNÁNDEZ_vot_result"] = +d["RODOLFO_HERNÁNDEZ_vot"]/d.votant;
      d["GUSTAVO_PETRO_vot_result"] = +d["GUSTAVO_PETRO_vot"]/d.votant;
      d["votbla result"] = +d["votbla"]/d.votant;
      d.nulos_no_marcados = (+d["votnul"] + +d["votnma"])/d.votant;
      d.pct = (d["RODOLFO_HERNÁNDEZ_vot"]-d["GUSTAVO_PETRO_vot"])/d.votant;

      d.feat = dFeatures[d.dane];
      d.region = d.dpto.toUpperCase() !== "CONSULADOS" ? dRegiones[d.dane] : "Consulados";
    });

    segundaVueltaNest = d3.nest()
      .key(d => d.dpto)
      .rollup(v => d3.mean(v, d => d.pct))
      .entries(segundaVuelta);

    segundaVueltaNest.forEach(d => {
      d.feat = dFeatures[d.key];
    });


    r = width/15;


  }


  chart.showMap = function (_) {
    // stillWantTitle = false;
    if (!arguments.length) { return showMap; }
    showMap=_;
    resetForces();
    // simulation.restart();
    redrawMap();
    return chart;
  };
  chart.r = function (_) {
    // stillWantTitle = false;
    if (!arguments.length) { return r; }
    r=_;
    simulation.restart();
    return chart;
  };
  chart.collision = function (_, restart) {
    // stillWantTitle = false;
    if (!arguments.length) { return collision; }
    collision=_;
    resetForces(restart);
    if (restart) simulation.restart();
    return chart;
  };
  chart.yByPopulation = function (_) {
    // stillWantTitle = false;
    if (!arguments.length) { return yByPopulation; }
    yByPopulation =_;
    resetForces();
    simulation.restart();
    return chart;
  };

  chart.choroplet = function (_) {
    // stillWantTitle = false;
    if (!arguments.length) { return choroplet; }
    choroplet =_;
    // simulation.restart();
    color = getColorScale();
    redrawMap();
    return chart;
  };

  chart.byCities = function (_) {
    // stillWantTitle = false;
    if (!arguments.length) { return byCities; }
    byCities =_;
    // simulation.restart();
    redrawMap();
    return chart;
  };

  chart.showCircles = function (_, _scramble) {
    // stillWantTitle = false;
    if (!arguments.length) { return showCircles; }
    showCircles =_;
    if (_scramble) {
      scramble();
    }
    simulation.restart();
    return chart;
  };

  chart.useSize = function (_, restart) {
    // stillWantTitle = false;
    if (!arguments.length) { return useSize; }
    useSize =_;
    resetForces();
    if (restart) simulation.restart();
    return chart;
  };

  chart.circlesByGeo = function (_) {
    // stillWantTitle = false;
    if (!arguments.length) { return circlesByGeo; }
    circlesByGeo =_;
    xToCenter = false;
    yToCenter = false;
    resetForces();
    simulation.restart();
    return chart;
  };

  chart.byCities = function (_) {
    // stillWantTitle = false;
    if (!arguments.length) { return byCities; }
    byCities =_;
    // path2D = new Path2D();
    // if (showMap) {
    //   pathCanvas
    //     .context(path2D)(byCities ? land : landState);
    // }
    simulation.restart();
    redrawMap();
    return chart;
  };

  chart.useShades = function (_) {
    // stillWantTitle = false;
    if (!arguments.length) { return useShades; }
    useShades =_;
    color = getColorScale();
    // simulation.restart();
    redrawMap();
    return chart;
  };

  chart.xToCenter = function (_) {
    // stillWantTitle = false;
    if (!arguments.length) { return xToCenter; }
    xToCenter =_;
    resetForces();
    simulation.restart();
    return chart;
  };

  chart.yToCenter = function (_) {
    // stillWantTitle = false;
    if (!arguments.length) { return yToCenter; }
    yToCenter =_;
    resetForces();
    simulation.restart();
    return chart;
  };

  chart.circlesDancing = function (_) {
    // stillWantTitle = false;
    if (!arguments.length) { return circlesDancing; }
    circlesDancing =_;
    showCircles = _;
    circlesByGeo = !_;
    yToCenter = _;
    useSize = _;
    useShades = _;
    collision = _;
    color = getColorScale();
    r = _ ? 5: 50;
    // forceToCentroid = _ ? -0.05: 0.3;

    d3.select(contextBg.canvas)
      .style("z-index", _ ? 3 : -1);
    if (_) setNodesToMap();
    resetForces();
    simulation.restart();
    return chart;
  };


  chart.redrawMap = redrawMap;
  chart.drawTitle = drawTitle;

  return chart;
}








