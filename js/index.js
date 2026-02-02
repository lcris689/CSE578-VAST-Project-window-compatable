const width = 1076, height = 1144;

var margin_1 = { top: 40, right: 40, bottom: 40, left: 40 };
var width_1 = width - margin_1.left - margin_1.right;
var height_1 = height - margin_1.top - margin_1.bottom;

var margin_2 = { top: 40, right: 40, bottom: 40, left: 40 };
var  width_2 =  width - margin_2.left - margin_2.right;
var  height_2 = height - margin_2.top - margin_2.bottom;

var svg, svgInfo, xScale,yScale, xScale_2, yScale_2;
var xAxisInfo, yAxisInfo;
var x_axis_2, y_axis_2;
var venueData;


function plotPubsBars(){
  Promise.all([
      d3.json("http://127.0.0.1:5000/getPubs"),
      d3.json("http://127.0.0.1:5000/getRestaurants")
    ]).then(function (data) {

      svg
        .selectAll('restaurants')
        .data(data[1])
        .enter()
        .append("image")
        .attr("xlink:href","Burger.png")
        .attr('class','restaurants')
        .attr('x', function(d){
          return xScale(d.pointX) - 10
        })
        .attr('y', function(d){
          return yScale(d.pointY) - 10
        })
        .attr("width", 20)
        .attr("height", 20)
        .attr('stroke', 'black')
        .attr('fill', 'green')
        .on("mouseover", function (e, d) {
          d3.select("#tip").transition().duration(150).style("opacity", 1);
          d3.select("#tip")
            .html(
              "<p>Food Cost : " +
              d.foodcost +
              "<br>" +
              "Max Occupancy : " +
              d.maxoccupancy +
              "</p>"
            )
          .style("left", e.pageX + 12 + "px")
          .style("top", e.pageY + "px");
        })
        .on("mouseout", function (e, d) {
          d3.select("#tip").transition().duration(150).style("opacity", 0);
        })
        .on("click", function (e, d) {
          svgInfo.selectAll(".data_lines_kids").remove();
          svgInfo.selectAll(".data_lines_nokids").remove();
          infoVis(d.restaurantid,"Restaurant");
        });
      
      svg
        .selectAll('pubs')
        .data(data[0])
        .enter()
        .append("image")
        .attr("xlink:href","Beer.png")
        .attr('class','restaurants')
        .attr('x', function(d){
          return xScale(d.pointX) - 10
        })
        .attr('y', function(d){
          return yScale(d.pointY) - 10
        })
        .attr("width", 20)
        .attr("height", 20)
        .attr('stroke', 'black')
        .attr('fill', 'red')
        .on("mouseover", function (e, d) {
          d3.select("#tip").transition().duration(150).style("opacity", 1);
          d3.select("#tip")
            .html(
              "<p>Hourly Cost : " +
              d.hourlycost +
              "<br>" +
              "Max Occupancy : " +
              d.maxoccupancy +
              "</p>"
            )
            .style("left", e.pageX + 12 + "px")
            .style("top", e.pageY + "px");
        })
        .on("mouseout", function (e, d) {
          d3.select("#tip").transition().duration(150).style("opacity", 0);
        })
        .on("click", function (e, d) { 
          svgInfo.selectAll(".data_lines_kids").remove();
          svgInfo.selectAll(".data_lines_nokids").remove();
          infoVis(d.pubid,"Pub");
        });
  })
}

document.addEventListener("DOMContentLoaded", function () {
  svg = d3
    .select("#my_dataviz")
    .append("svg")
    .attr("width", width_1 + margin_1.left + margin_1.right)
    .attr("height", height_1 + margin_1.top + margin_1.bottom)
    .attr("id","chart-svg");
    
  svgInfo = d3
    .select("#my_dataviz2")
    .append("svg")
    .attr("class","chart")
    .attr("width", width_2 + margin_2.left + margin_2.right)
    .attr("height", height_2 + margin_2.top + margin_2.bottom);

    svgInfo
      .append("text")
      .attr("class","establishment_type")
      .attr("text-anchor", "middle")
      .text("No Establishment Selected!")
      .attr("x", width/2 - margin_1.left)
      .attr("y", 15)
      .attr("font-size", "20px")
      .attr("font-weight", "bold");



  xAxisInfo = svgInfo.append("g").attr("transform", "translate(90," + height_2  + ")");
  yAxisInfo = svgInfo.append("g").attr("transform", "translate(60, 50)");

  d3.selectAll('input[name="dayOfWeek"]')
    .on("change", function(){
      svgInfo.selectAll(".data_lines_kids").remove();
      svgInfo.selectAll(".data_lines_nokids").remove();
      plotData(this.value);
    });

    
    
  xScale = d3.scaleLinear()
    .range([margin_1.right, width_1-margin_1.left]);
  yScale = d3.scaleLinear()
    .range([height_1 - margin_1.top, margin_1.bottom]);
    
  function scale () {
    return d3.geoTransform({
      point: function(x, y) {
        this.stream.point(xScale(x), yScale(y));
      }
    });
  }

  Promise.all([
      d3.json("http://127.0.0.1:5000/getBuildings")
    ]).then(function (data) {
    
      var maxX = 0, minX= 0, maxY = 0, minY = 0;
      data[0].forEach(element => {
        element.geometry.coordinates[0].forEach(coord => {
          minX = Math.min(minX, coord[0])
          maxX = Math.max(maxX, coord[0])
          minY = Math.min(minY, coord[1])
          maxY = Math.max(maxY, coord[1])
        })
      }); 

      xScale.domain([minX, maxX]);
      yScale.domain([minY, maxY]);

      svg.selectAll("path")
        .data(data[0])
        .enter()
        .append("path")
        .attr("fill", function(d){
          if(d.buildingtype == "Residental"){
            return "Lightgrey"
          }
          else if(d.buildingtype == "Commercial"){
            return "#61b7ac"
          }
          else{
            return "Brown"
          }
        })
        .attr("d", d3.geoPath().projection(scale()))
        .style("stroke-width", "1px")
        .style("stroke", "Grey");
      
      addLabels();
      plotPubsBars();

    });
});


function infoVis(id,type){
  Promise.all([
      d3.json("http://127.0.0.1:5000/getCheckins/"+id)
    ]).then(function (data) {
      selectedDay = d3.select('input[name="dayOfWeek"]:checked').node().value

      svgInfo.selectAll(".establishment_type").remove()
      svgInfo
      .append("text")
      .attr("class","establishment_type")
      .attr("text-anchor", "middle")
      .text(type + " : " + id)
      .attr("x", width/2 - margin_1.left)
      .attr("y", 15)
      .attr("font-size", "20px")
      .attr("font-weight", "bold");

      venueData = data[0]
      plotData(selectedDay)
        
    }) 
}

function drawaxis(data){
  xScale_2 = d3.scaleLinear()
    .domain([0, 23])
    .range([0, width_2 - 100]).nice();
  
  
  var max_data = d3.max(data, function (d) {
    return d.kidpeople + d.nokidpeople;
  });

  yScale_2 = d3.scaleLinear()
    .domain([0, max_data])
    .range([height_2-50, 0]).nice();
  
  
  xAxisInfo.transition().duration(1000)
    .call(d3.axisBottom(xScale_2));

  yAxisInfo.transition().duration(1000).call(d3.axisLeft(yScale_2));

}

function plotData(day){
  filteredData = venueData.filter( function( d ) {
    return d.day == +day;
  });


  drawaxis(filteredData);
  addInfoLabels();
  
  svgInfo.selectAll(".data_lines_kids").data(filteredData)
    .enter()
    .append("rect")
    .attr("transform", "translate(80, 50)")
    .attr("class","data_lines_kids")
    .attr("x",function(d){
      return xScale_2(d.hour)
    })
    .attr("width", 30)
    .attr("y",yScale_2(0))
    .attr("height", 0)
    .transition()
    .ease(d3.easeLinear)
    .duration(1000)
    .attr("y", function(d){
      return yScale_2(d.kidpeople)
    })
    .attr("height", function(d){
      return yScale_2(0) - yScale_2(d.kidpeople);
    })
    .attr("fill","#58508d");

  svgInfo.selectAll(".data_lines_nokids").data(filteredData)
    .enter()
    .append("rect")
    .attr("transform", "translate(80, 50)")
    .attr("class","data_lines_nokids")
    .attr("x",function(d){
      return xScale_2(d.hour)
    })
    .attr("width", 30)
    .attr("y",function (d){
      return yScale_2(d.kidpeople)})
    .attr("height", 0)
    .transition()
    .ease(d3.easeLinear)
    .delay(1000)
    .duration(1000)
    .attr("y", function(d){
      return yScale_2(d.kidpeople + d.nokidpeople)
    })
    .attr("height", function(d){
      return yScale_2(d.kidpeople) - yScale_2(d.nokidpeople + d.kidpeople);
    })
    .attr("fill","#ff6361");
}

function addLabels(){

  svg
    .append("rect")
    .attr("height", 12)
    .attr("width", 12)
    .style("fill", "Lightgrey")
    .attr("x", 600)
    .attr("y", 0);

    svg
    .append("rect")
    .attr("height", 12)
    .attr("width", 12)
    .style("fill", "#61b7ac")
    .attr("x", 600)
    .attr("y", 20);

    svg
    .append("rect")
    .attr("height", 12)
    .attr("width", 12)
    .style("fill", "brown")
    .attr("x", 600)
    .attr("y", 40);

    svg
    .append("image")
        .attr("xlink:href","Beer.png")
        .attr('class','restaurants')
        .attr('x', 600)
        .attr('y', 60)
        .attr("width", 12)
        .attr("height", 12)

    svg
    .append("image")
        .attr("xlink:href","Burger.png")
        .attr('class','restaurants')
        .attr('x', 600)
        .attr('y', 80)
        .attr("width", 12)
        .attr("height", 12)

  svg
    .append("text")
    .attr("text-anchor", "middle")
    .text("Residential")
    .attr("x", 750)
    .attr("y", 12);
  

  svg
    .append("text")
    .attr("text-anchor", "middle")
    .text("Commercial")
    .attr("x", 750)
    .attr("y", 32);

  svg
    .append("text")
    .attr("text-anchor", "middle")
    .text("School")
    .attr("x", 750)
    .attr("y", 52);

    svg
    .append("text")
    .attr("text-anchor", "middle")
    .text("Pubs")
    .attr("x", 750)
    .attr("y", 72);

    svg
    .append("text")
    .attr("text-anchor", "middle")
    .text("Restaurants")
    .attr("x", 750)
    .attr("y", 92);

}

function addInfoLabels(){

  svgInfo
    .append("rect")
    .attr("height", 12)
    .attr("width", 12)
    .style("fill", "#ff6361")
    .attr("x", 100)
    .attr("y", 60);

    svgInfo
    .append("rect")
    .attr("height", 12)
    .attr("width", 12)
    .style("fill", "#58508d")
    .attr("x", 100)
    .attr("y", 80);

    svgInfo
    .append("text")
    .attr("text-anchor", "middle")
    .text("Without Kids")
    .attr("x", 200)
    .attr("y", 72);

    svgInfo
    .append("text")
    .attr("text-anchor", "middle")
    .text("With Kids")
    .attr("x", 200)
    .attr("y", 92);

    svgInfo
    .append("text")
    .style("text-anchor", "middle")
    .text("Visit Count")
    .style("transform","rotate(-90deg)")
    .attr("y", 10)
    .attr("x", -500);

    svgInfo
    .append("text")
    .style("text-anchor", "middle")
    .text("Hour")
    .attr("x", (width_2 / 2) + 30)
    .attr("y", height_2 + 30);

}