// URL: https://beta.observablehq.com/@john-guerra/segunda-vuelta-colombia-2018
// Title: Segunda Vuelta Colombia 2018
// Author: John Alexis Guerra Gómez (@john-guerra)
// Version: 788
// Runtime version: 1

const m0 = {
  id: "5c526ff1e363d726@788",
  variables: [
    {
      inputs: ["md"],
      value: (function(md){return(
md`# Segunda Vuelta Colombia 2018
Así votó Colombia en la segunda vuelta. Cada círculo representa un municipio, su tamaño es la cantidad de gente que votó allí y el color si votó en su mayoría por <span>Petro</span> o por Duque` 
)})
    },
    {
      inputs: ["DOM","width","height","segundaVuelta","dFeatures","dRegiones2","pathCanvas","x","y","drawMap","byCities","land","landState","d3","forceToCentroid","colision","size","collisionFactor","color","regiones","invalidation"],
      value: (function*(DOM,width,height,segundaVuelta,dFeatures,dRegiones2,pathCanvas,x,y,drawMap,byCities,land,landState,d3,forceToCentroid,colision,size,collisionFactor,color,regiones,invalidation)
{
  const context = DOM.context2d(width, height);
  const svg = DOM.svg(width, height);
  const nodes = segundaVuelta;
  const path2D = new Path2D();
  let selected = null;
  
  segundaVuelta.forEach( d=> {
    d.feat = dFeatures[d.dane];
    d.region = d.departamento !== "Consulados" ? dRegiones2[d.dane] : "Consulados";
    d.centroid = d.feat && d.departamento !== "Consulados" ?  
      pathCanvas.centroid(d.feat) :
    [200, height/2];
    d.centroid2 = [x(d.pct),y(d.region)+y.bandwidth()/2];    
    // d.centroid2 = [x(d.pct),y(d.votantes)];    
  })
  if (drawMap) {
    pathCanvas.context(path2D)
      (byCities ? land : landState);
  }
  
  // nodes.forEach(d => {
  //   d.feat = dFeatures[d.dane];
  //   d.region = dRegiones[d.departamento];
  //   d.centroid = d.feat && d.departamento !== "Consulados" ?  
  //     pathCanvas.centroid(d.feat) :
  //     [200, height/2];
  //   d.centroid2 = [x(d.pct),y(d.region)+y.bandwidth()/2];
  // });
  
  function scramble()  {
    nodes.forEach(n => {
      n.x=Math.random()*width; n.y=0;
    });
  }

  
  const simulation = d3.forceSimulation(nodes)
      .force("x", d3.forceX(d=> drawMap ? d.centroid[0] : d.centroid2[0]).strength(forceToCentroid))
      .force("y", d3.forceY(d=> drawMap ? d.centroid[1] : d.centroid2[1]).strength(forceToCentroid))
      // .force("charge", d3.forceManyBody())
      .force("collide", colision ? 
             d3.forceCollide(d => size(d.votantes)*collisionFactor).iterations(4):
            ()=>{})
      .on("tick", ticked);
  // scramble();

  
  // setTimeout(() => nodes.forEach( n => { 
  //   simulation.alpha(0.9).restart();scramble(); }) , 1000);

    d3.select(context.canvas)
      .on("mousemove", () => {
        selected = simulation.find(d3.event.offsetX, d3.event.offsetY);
        ticked();
        // console.log("xy",d3.event, d3.event.offsetX, d3.event.offsetY);
        console.log(selected);
        console.log(selected.pct);
      });

  context.globalCompositeOperation = "multiply";

  function ticked() {
    context.globalAlpha = 1;
    context.clearRect(0, 0, width, height);

    for (const n of nodes) {
      let nr = size(n.votantes)
      context.fillStyle=color(n.pct);
      context.beginPath();
      context.arc(n.x, n.y, nr, 0, 2 * Math.PI);
      context.fill();      
    }
    if (selected) {
      context.strokeStyle="orange";
      context.lineWidth = 2;
      context.beginPath();
      context.arc(selected.x, selected.y, size(selected.votantes), 0, 2 * Math.PI);
      context.stroke();   
      context.fillStyle="#777";
      context.textAlign="center"; 
      context.fillText(selected.municipio, selected.x, selected.y+2);      
    }
    // Draw Labels

    for (const n of nodes) {
      let nr = size(n.votantes)
      if (nr>9) {
        context.fillStyle="#a14";
        context.textAlign="center"; 
        context.fillText(n.municipio, n.x, n.y+2);
      }
    }    
    
    if (drawMap) {        
      context.fillStyle="#777";
      context.fillText("Consulados", 200, height/2 - 30);
    } else {
      regiones.forEach(r => {          
          context.fillStyle="#777";
          context.fillText(r, 100, y(r));        
      })
    }
    
    if (drawMap) {      
      context.save();
      context.lineWidth = 1;
      context.globalAlpha = 0.1;
      context.beginPath();
      context.strokeStyle = "black";
      context.stroke(path2D);
      context.restore();  
    }    
  }
  
  try {
    yield context.canvas;
    yield invalidation;
  } finally {
    simulation.stop();
  }
}
)
    },
    {
      inputs: ["d3","DOM","width","color"],
      value: (function*(d3,DOM,width,color)
{
  const svg = d3.select(DOM.svg(width, 60));
  const fmt = d3.format(" >5.2%");

  var legendLinear = d3.legendColor()
        .shapeWidth(width/8)
        .cells(7)
        .orient("horizontal")
        .title("Difference")
        .labels([
            " 100.00% Duque",
            "  66.67%",
            "  33.33%",
            "   0.00%",
            "  33.33%",
            "  66.67%",
            " 100.00% Petro",
        ].reverse())
        .labelFormat(fmt)
        .ascending(false)
        .labelAlign("end")
        .scale(color);

  yield svg.node();
  svg.append("g")
     .call(legendLinear)
     .selectAll("text")
    .style("font", "10pt sans-serif");
}
)
    },
    {
      inputs: ["d3","DOM","width","size","color"],
      value: (function*(d3,DOM,width,size,color)
{
  const svg = d3.select(DOM.svg(width, size(4000000)*2 + 50));
  const fmt = d3.format(" >5.2s");

  var legend = d3.legendSize()
    .shapePadding(width/5- size(4000000))
    .orient("horizontal")
    .shape("circle")
    .labelFormat(fmt)
    .title("Votantes por ciudad")
    .scale(size);
  let g = svg.append("g")
    .attr("transform", "translate(50,20)");
  yield svg.node();
  g
     .call(legend);
  g.selectAll(".label")
    .style("font", "10pt sans-serif");
  g.selectAll(".swatch")
    .style("fill", color(0)); 
}
)
    },
    {
      name: "viewof r",
      inputs: ["html"],
      value: (function(html){return(
html`<input type=range value=40 min=0.1 max=100 step=0.1></input>`
)})
    },
    {
      name: "r",
      inputs: ["Generators","viewof r"],
      value: (G, _) => G.input(_)
    },
    {
      name: "viewof collisionFactor",
      inputs: ["html"],
      value: (function(html){return(
html`<input type=range value=1.1 min=0.1 max=2 step=0.01></input>`
)})
    },
    {
      name: "collisionFactor",
      inputs: ["Generators","viewof collisionFactor"],
      value: (G, _) => G.input(_)
    },
    {
      name: "viewof forceToCentroid",
      inputs: ["html"],
      value: (function(html){return(
html`<input type=range value=0.3 min=0.01 max=1.5 step=0.01></input>`
)})
    },
    {
      name: "forceToCentroid",
      inputs: ["Generators","viewof forceToCentroid"],
      value: (G, _) => G.input(_)
    },
    {
      name: "viewof drawMap",
      inputs: ["html"],
      value: (function(html){return(
html`<input type='checkbox' checked='true'></input>`
)})
    },
    {
      name: "drawMap",
      inputs: ["Generators","viewof drawMap"],
      value: (G, _) => G.input(_)
    },
    {
      name: "viewof byCities",
      inputs: ["html"],
      value: (function(html){return(
html`<input type='checkbox'></input>`
)})
    },
    {
      name: "byCities",
      inputs: ["Generators","viewof byCities"],
      value: (G, _) => G.input(_)
    },
    {
      name: "viewof colision",
      inputs: ["html"],
      value: (function(html){return(
html`<input type='checkbox' checked></input>`
)})
    },
    {
      name: "colision",
      inputs: ["Generators","viewof colision"],
      value: (G, _) => G.input(_)
    },
    {
      name: "height",
      value: (function(){return(
700
)})
    },
    {
      name: "color",
      inputs: ["d3"],
      value: (function(d3){return(
d3.scaleSequential(d3.interpolatePuOr)
  .domain([-1, 1])
)})
    },
    {
      name: "size",
      inputs: ["d3","segundaVuelta","r"],
      value: (function(d3,segundaVuelta,r){return(
d3.scalePow()
  .exponent(0.5)
  .domain([0, d3.max(segundaVuelta, d=> d.votantes)])
  .range([1,r])
)})
    },
    {
      name: "x",
      inputs: ["d3","width"],
      value: (function(d3,width){return(
d3.scaleLinear()
  .domain([-1, 1])
  .range([0, width])
)})
    },
    {
      name: "y",
      inputs: ["d3","regiones","height"],
      value: (function(d3,regiones,height){return(
d3.scaleBand()
  .domain(regiones)
  .range([height-100, 100])
)})
    },
    {
      name: "land",
      inputs: ["topojson","mapData"],
      value: (function(topojson,mapData){return(
topojson.feature(mapData, {
    type: "GeometryCollection",
    geometries: mapData.objects.mpios.geometries
  })
)})
    },
    {
      name: "landState",
      inputs: ["topojson","mapData"],
      value: (function(topojson,mapData){return(
topojson.feature(mapData, {
    type: "GeometryCollection",
    geometries: mapData.objects.depts.geometries
  })
)})
    },
    {
      name: "dFeatures",
      inputs: ["land"],
      value: (function(land)
{
  const dFeatures = {};
  land.features.forEach( d => {
    dFeatures[+d.id] = d;
  });
  return dFeatures;
}
)
    },
    {
      name: "pathCanvas",
      inputs: ["d3","margin","width","height","landState"],
      value: (function(d3,margin,width,height,landState){return(
d3.geoPath()
      .projection(d3.geoTransverseMercator()
          .rotate([74 + 30 / 60, -38 - 50 / 60])
          .fitExtent([[margin.left, margin.top], [width-margin.right, height-margin.bottom]], landState))
)})
    },
    {
      name: "margin",
      value: (function()
{ return { left: 20, top: 20, right:20, bottom: 20}}
)
    },
    {
      name: "mapData",
      inputs: ["d3"],
      value: (function(d3){return(
d3.json("https://gist.githubusercontent.com/john-guerra/95074aef40181d2b3b697c5624bec2b8/raw/c4631751a01d5ed9e95eca680b93232327284a54/colombia-municipios.json")
)})
    },
    {
      name: "segundaVuelta",
      inputs: ["d3"],
      value: (function(d3){return(
d3.csv("https://raw.githubusercontent.com/infrahumano/elecciones2018/master/segunda_vuelta_presidencial/segunda_vuelta_presidencial.csv")
  .then( data => 
    data.map( d=> {
      d.votantes = +d.votantes;
      d.dane = +d.dane;
      d['iván duque'] = +d['iván duque'];
      d['gustavo petro'] = +d['gustavo petro'];
      d['iván duque result'] = +d['iván duque']/d.votantes;
      d['gustavo petro result'] = +d['gustavo petro']/d.votantes;    
      d.pct = (d['iván duque']-d['gustavo petro'])/d.votantes;
      return d;
    })
  )
)})
    },
    {
      name: "d3",
      inputs: ["require"],
      value: (function(require){return(
require("d3", "d3-svg-legend")
)})
    },
    {
      name: "topojson",
      inputs: ["require"],
      value: (function(require){return(
require("topojson")
)})
    },
    {
      name: "dRegiones",
      value: (function()
{return {
"Amazonas":"Amazonía",
"Antioquia":"Caribe",
"Arauca":"Orinoquía",
"Atlantico":"Caribe",
"Bogotá D.C.":"Andina",
"Bolivar":"Caribe",
"Boyaca":"Andina",
"Caldas":"Andina",
"Caqueta":"Amazonía",
"Casanare":"Orinoquía",
"Cauca":"Pacífico",
"Cesar":"Caribe",
"Choco":"Pacífico",
"Consulados":"Otros",
"Cordoba":"Caribe",
"Cundinamarca":"Andina",
"Guainia":"Amazonía",
"Guaviare":"Amazonía",
"Huila":"Andina",
"La Guajira":"Caribe",
"Magdalena":"Caribe",
"Meta":"Orinoquía",
"Nariño":"Pacífico",
"Norte De San":"Andina",
"Putumayo":"Amazonía",
"Quindio":"Andina",
"Risaralda":"Andina",
"San Andres":"Otros",
"Santander":"Andina",
"Sucre":"Caribe",
"Tolima":"Andina",
"Valle":"Pacífico",
"Vaupes":"Amazonía",
"Vichada":"Orinoquía"
};
}
)
    },
    {
      name: "regiones",
      inputs: ["d3","dRegiones2"],
      value: (function(d3,dRegiones2){return(
d3.set(d3.values(dRegiones2)).values()
)})
    },
    {
      name: "regionesDane",
      inputs: ["d3"],
      value: (function(d3){return(
d3.csv("https://gist.githubusercontent.com/john-guerra/b5848316671422b19e19bfca7f8aadcb/raw/275dca38ffbb1479afc7c0df1ed660ecfd3038b7/Departamentos_y_municipios_de_Colombia.csv")
)})
    },
    {
      name: "dRegiones2",
      inputs: ["regionesDane"],
      value: (function(regionesDane)
{
  let dR = {};
  regionesDane.forEach(d => {
    dR[+d["CÓDIGO DANE DEL MUNICIPIO"]] = d.REGION;
  });
  dR[0] = "Consulados";
  return dR;
}
)
    }
  ]
};

const notebook = {
  id: "5c526ff1e363d726@788",
  modules: [m0]
};

export default notebook;
