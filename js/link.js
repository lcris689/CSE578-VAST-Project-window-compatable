// data
var globalData;
var ranData;
var nodedata;
var locationData;
var locationData1;
var dateFrom = "2022-03-01";
var timeFrom = "00:00:00";
var dateTo = "2023-05-24";
var timeTo = "23:00:00";

// svg
const width = 1076, height = 1144;
var margin_1 = { top: 40, right: 40, bottom: 40, left: 40 };
var width_1 = width - margin_1.left - margin_1.right;
var height_1 = height - margin_1.top - margin_1.bottom;

var firstDate = new Date(1991,0,1), lastDate = new Date(2024,0,1);
var g, defs;

// date format
var parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");
var parseTime2 = d3.timeParse("%Y-%m-%dT%H:%M:%SZ");
var formatTime = d3.timeFormat("%H:%M");

// selected dot id's
var selectedParticipants;

// this is used for testing purposes (csv only has data of 100 participants)
var numberOfParticipants = 1010

// slider for timeScale
var slider = document.getElementById("myRange");
var currentTime = "00:00"
var allData = new Array(288) // holds data for current day
var dataSelected = []


// this function is called when the page is loaded
document.addEventListener('DOMContentLoaded', function () {
    svg = d3
        .select("#my_dataviz")
        .append("svg")
        .attr("width", width_1 + margin_1.left + margin_1.right)
        .attr("height", height_1 + margin_1.top + margin_1.bottom)
        .attr("id","chart-svg");
    
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
        d3.json( "http://127.0.0.1:5000/getBuildings")
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
    });

    Promise.all([
        d3.csv("data/Journals/TravelJournal.csv", (d) => {
            return{
                participantId: d.participantId,
                checkInTime: new Date(d.checkInTime),
                travelStartLocationId: d.travelStartLocationId,
                checkOutTime: new Date(d.checkOutTime),
                travelEndLocationId: d.travelEndLocationId,
                purpose: d.purpose,
            };
        }),
        d3.json("http://127.0.0.1:5000/getPeople/2022-03-01"),
        d3.csv("data/Attributes/Restaurants.csv", (d) => {
            return{
                placeId: d.restaurantId,
                cost: +d.foodCost,
                name: "Resturant",
                xCord: +d.location.split(" ")[1].substring(1),
                yCord: +d.location.split(" ")[2].substring(0, d.location.split(" ")[2].length-1),
            };
        }),
        d3.csv("data/Attributes/Schools.csv", (d) => {
            return{
                placeId: d.schoolId,
                cost: +d.monthlyCost,
                name: "School",
                xCord: +d.location.split(" ")[1].substring(1),
                yCord: +d.location.split(" ")[2].substring(0, d.location.split(" ")[2].length-1),
            };
        }),
        d3.csv("data/Attributes/Pubs.csv", (d) => {
            return{
                placeId: d.pubId,
                cost: +d.hourlyCost,
                name: "Pubs",
                xCord: +d.location.split(" ")[1].substring(1),
                yCord: +d.location.split(" ")[2].substring(0, d.location.split(" ")[2].length-1),
            };
        }),
        d3.csv("data/Attributes/Apartments.csv", (d) => {
            return{
                placeId: d.apartmentId,
                cost: +d.rentalCost,
                name: "Apartment",
                xCord: +d.location.split(" ")[1].substring(1),
                yCord: +d.location.split(" ")[2].substring(0, d.location.split(" ")[2].length-1),
            };
        }),  
        d3.csv("CustomData/averages.csv", (d) => {
            return{
                placeId: d.employerId,
                cost: d.average_hourly_rate,
                name: "Employer",
                xCord: +d.location.split(" ")[1].substring(1),
                yCord: +d.location.split(" ")[2].substring(0, d.location.split(" ")[2].length-1),
            };
        }),  
    ]).then(function (values) {
        
        nodedata = values[0];
        data = values[1]
        data.forEach(function(d){
            d.date = parseTime(d.timestamp),
            d.time = formatTime(parseTime(d.timestamp)),
            d.xLoc = +d.xLoc,
            d.yLoc = +d.yLoc,
            d.participantId = +d.participantID
        })
        globalData = data
        locationData1 = values[2];
        locationData = locationData1.concat(values[3], values[4], values[5], values[6]);
        //console.log(globalData)
        console.log("data ready");
        parseDataDate()
        updateSlider()
        
    })
})



function parseDataDate(){ // reorganize the data per 5 minute intervals (feed it all data for 1 day)
    for(var j = 0; j< 288;j++){ // 288 timestamps per day
        allData[j] = new Array()
        for(var i = 0; i < numberOfParticipants+1; i++){
            allData[j].push(globalData[i +(numberOfParticipants+1)*j])
        }
    }
}

function drawMap(){

    // get data    
    var data
    for(var i = 0; i < allData.length; i++){ // find which group of data to graph
        if(allData[i][0].time == currentTime){
            data = allData[i] 
            // console.log("match")
            // console.log(currentTime)
            // console.log(allData[i][0].time)
        }
    }

    console.log(0,d3.max(data, d=>d.yLoc))

    var circles = svg.selectAll("circle")
        .data(data, d=>d.participantId)
        .join(
            enter => enter.append("circle")
                .attr("class", "circle")
                .attr("id", (d) => {
                    return "dot-" + d.participantId;
                })
                .attr("cx", d=>xScale(d.xLoc))
                .attr("cy", d=>yScale(d.yLoc))
                .attr("r", 4)
                .attr('fill', "steelblue")
                .attr('stroke', 'black')
                .attr("stroke-width", 0.5)
                .on('mouseover', function(event,d){
                    console.log(d)
                }),
            update => update.call(update => update.transition()
                .duration(1000)
                .attr("cx", d=>xScale(d.xLoc))
                .attr("cy", d=>yScale(d.yLoc)))
        );
    
    // LASSO use varaible "selected" for array of selected id's
    // ERROR d3.lasso() not a function version problem
    // Solution found here: https://stackoverflow.com/questions/64107576/lasso-plugin-wont-work-with-d3-upgrade-to-v6 changes made to better group selected data
    let coords = [];
    const lineGenerator = d3.line();

    const pointInPolygon = function (point, vs) {
        // console.log(point, vs);
        // ray-casting algorithm based on
        // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

        var x = point[0],
            y = point[1];

        var inside = false;
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            var xi = vs[i][0],
                yi = vs[i][1];
            var xj = vs[j][0],
                yj = vs[j][1];

            var intersect =
                yi > y != yj > y &&
                x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
            if (intersect) inside = !inside;
        }

        return inside;
    };

    function drawPath() {
        d3.select("#lasso")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .style("fill", "#00000054")
            .attr("d", lineGenerator(coords));
    }

    function dragStart() {
        coords = [];
        circles.attr("fill", "steelblue").attr("r",4);
        d3.select("#lasso").remove();
        d3.select("#chart-svg")
            .append("path")
            .attr("id", "lasso");
    }

    function dragMove(event) {
        let mouseX = event.sourceEvent.offsetX - margin_1.left;
        let mouseY = event.sourceEvent.offsetY - margin_1.top;
        coords.push([mouseX, mouseY]);
        drawPath();
    }

    function dragEnd() {
        let selectedDots = [];
        circles.each((d, i) => {
            let point = [
                xScale(d.xLoc),
                yScale(d.yLoc),
            ];
            if (pointInPolygon(point, coords)) {
                d3.select("#dot-" + d.participantId).attr("fill", "red").attr("r",4.5);
                selectedDots.push(d.participantId);
                dataSelected.push([])
            }
            
        });
        console.log(`select: ${selectedDots}`);
        selected = selectedDots // This is a list of selected participant IDs
        //nodeChart(); // add chart function here if you want to update your chart with lasso select
        timeData(); // add chart function here if you want to update your chart with lasso select
        d3.select("#lasso").remove();
    }

    const drag = d3
        .drag()
        .on("start", dragStart)
        .on("drag", dragMove)
        .on("end", dragEnd);

    svg.call(drag); 
}

function updateSlider(){ // function used to track slider and changed values
    slider = document.getElementById("myRange");
    hours = Math.floor(slider.value*5 / 60);
    minutes = slider.value*5 % 60;
    minuteOutput = $("#minutes")[0];
    hourOutput = $("#hours")[0];
    hourOutput.innerHTML = hours;
    minuteOutput.innerHTML = minutes;
    if(minutes < 10){
        minuteOutput.innerHTML = "0"+minutes;
        minutes = "0"+minutes;
    }
    else {
        minuteOutput.innerHTML = minutes;
    }
    if(hours < 10){
        hourOutput.innerHTML = "0"+hours;
        hours = "0"+hours
    }
    else {
        hourOutput.innerHTML = hours;
    }
    currentTime = hours + ":" + minutes
    drawMap()
}

function timeData(){
    // this takes date and time from the user
    const dateFromInput = document.getElementById("date-from-input");
    const timeFromInput = document.getElementById("time-from-input");
    const dateToInput = document.getElementById("date-to-input");
    const timeToInput = document.getElementById("time-to-input");

    dateFrom = dateFromInput.value;
    timeFrom = timeFromInput.value;
    dateTo = dateToInput.value;
    timeTo = timeToInput.value;

    var from = new Date(dateFrom+"T"+timeFrom+"Z");
    var to = new Date(dateTo+"T"+timeTo+"Z");
    
    //filtering data based on the range
    var selectedTimeData = nodedata.filter(d => d.checkInTime >= from && d.checkOutTime <= to);
    
    //preventing the page from being auto refresh on submit
    event.preventDefault(); 
    //passing it ti checkbix check
    filterData();

    //this checks for the checkboxes 
    const checkboxes = d3.selectAll('input[type="checkbox"]');

    function filterData() {
        // Get the checked values of the checkboxes
        const checkedValues = d3.selectAll('input[type=checkbox]:checked').nodes().map(function(d){
            return d.id;
          });
      
        // Filter the data based on the checked values
        const filteredData2 = selectedTimeData.filter(d => checkedValues.includes(d.purpose));
        //create chart
        nodeChart(filteredData2);
      }
      
      //Event Listener
      checkboxes.on('change', filterData);

}


//this function creates the node link chart
function nodeChart(filteredData2){ // Create innovative chart with selected data points
    //console.log("test")
    
    d3.select("#node-svg").selectAll("*").remove();

    //margins
    var nodeMargin = {top: 40, right: 10, bottom: 10, left:40};
    //reduce 2700 for a smaller graph
    var nodeWidth = width - nodeMargin.right - nodeMargin.left;
    var nodeHeight = height - nodeMargin.bottom - nodeMargin.top;
    
    //creating svg for the chart
    var node_svg = d3.select("#node-svg")
    .attr("width", nodeWidth + nodeMargin.left + nodeMargin.right)
    .attr("height", nodeHeight + nodeMargin.top + nodeMargin.bottom)
    

    
    var node_content = node_svg.append("g")
    .attr("transform", `translate(${nodeMargin.left}, ${nodeMargin.top})`);

    //console.log("hellooo")
    console.log(filteredData2);


    //fitered data based on selected options
    var selectedData = filteredData2.filter( d => selected.includes(+d.participantId));
    
    //console.log(selectedData);
    //console.log(locationData);

    //creating the node link information array
    var nodes = [];
    var links = [];

    //traversing all of the final data
    selectedData.forEach(function(d) {
        var startNode = nodes.find(function(n) { return n.id === d.travelStartLocationId; });
        //if the start node doesnt exist
        if (!startNode) 
        {
            var info = locationData.find(function(n) { return n.placeId === d.travelStartLocationId; })
            var cost;
            var name;
            var xValue;
            var yValue;
            //getting info if info exists
            if(info){
                cost = info.cost;
                name = info.name;
                xValue = info.xCord;
                yValue = info.yCord;
            }
            else{
                cost = 0;
                name = "";
                xValue = 0;
                yValue = 0;
            }
            startNode = { id: d.travelStartLocationId, cost: cost, name: name, xValue: xValue, yValue: yValue }; //cost: info.cost, name: info.name
            //console.log(startNode);
            nodes.push(startNode);
        }
        var endNode = nodes.find(function(n) { return n.id === d.travelEndLocationId; });
        //checking if endnode exists otherwise adding it
        if (!endNode) 
        {
            var ab = locationData.find(function(n) { return n.placeId === d.travelEndLocationId; })
            var cost;
            var name;
            var xValue;
            var yValue;
            if(ab){
                cost = ab.cost;
                name = ab.name;
                xValue = ab.xCord;
                yValue = ab.yCord;
            }
            else{
                //console.log(d.travelEndLocationId);
                cost = 0;
                name = "";
                xValue = 0;
                yValue = 0;
            }
            endNode = { id: d.travelEndLocationId, cost: cost, name: name, xValue: xValue, yValue: yValue };
            //console.log(endNode);
            nodes.push(endNode);
        }
        //console.log(d.purpose);
        //adding links as source node and end node
        links.push({ source: startNode, target: endNode, purpose: d.purpose });
    });

    console.log(links);
    console.log(nodes);

    //setting up scales
    //+/- was to adjust the graph size.
    const xScale1 = d3.scaleLinear()
    .domain([d3.min(nodes, d => d.xValue-300), d3.max(nodes, d => d.xValue+100)])
    .range([0, nodeWidth]);
    const yScale1 = d3.scaleLinear()
    .domain([d3.min(nodes, d => d.yValue-300), d3.max(nodes, d => d.yValue+100)])
    .range([nodeHeight, 0]);

    //setting up color domain for the Nodes
    const colorDomain = [0, 5, 10, 30, 60, 100, 900, 1100];
    const colorRange = ["#ADFF2F", "#7CFC00", "#006400", "#FFC300", "#FF7F50", "#C70039 ", "#900C3F", "#581845"];
    // LightGray	#ADFF2F LawnGreen	#7CFC00 DarkGreen	#006400 Yellow  #FFC300 Coral	#FF7F50 OrangeRed	#C70039  Red	#900C3F DarkRed	#581845
    const colorScale = d3.scaleLinear()
    .domain(colorDomain)
    .range(colorRange);

    //setting up color domian for the links
    const colorDomain2 = ["Recreation (Social Gathering)", "Eating", "Coming Back From Restaurant", "Work/Home Commute", "Going Back to Home"];
    //const colorRange2 = ["#FFC107", "#8BC34A", "#FF5722", "#607D8B", "#3F51B5"];
    const colorRange2 = ["pink", "green", "red", "gray", "blue"];
    const colorScale2 = d3.scaleOrdinal()
    .domain(colorDomain2)
    .range(colorRange2);

        //creating the tooltip
        const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

        //reference - https://d3-graph-gallery.com/graph/network_basic.html
        //above mentioned reference was taken as an inspiraton for creating this chart.
        //the code is based on same base princliples but heavily modified for the project needs.

        //creating the lines, with a tooltip 
        var link = node_content.selectAll("line")
        .data(links)
        .join("line")
        .style("stroke", function(d) { return colorScale2(d.purpose); })
        .style("stroke-width", 2)
        .on("mouseover", (event, d) => {
            //console.log("tooltip");
            tooltip.html(`<strong>${d.purpose}</strong><br>
            Source: ${d.source.name} ID ${d.source.id} <br>
            Target: ${d.target.name} ID ${d.target.id}<br>
            Purpose: ${d.purpose}`)
            .style("opacity", 0.9)
            .style("top", event.pageY - 10 + "px")
            .style("left", event.pageX + 10 + "px");
        })
        .on("mouseout", (event, d) => {
            tooltip.style("opacity", 0);
        });

        //creating the node/circles with a tooltip -> to represent the loaction
        var node = node_content.selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", 25)
        .style("fill", function(d) { return colorScale(d.cost); })
        .on("mouseover", (event, d) => {
            //console.log("tooltip");
            tooltip.html(`<strong>${d.name} ID ${d.id}</strong><br>
            ID: ${d.id}<br>
            Type: ${d.name}<br>
            Cost: $${d.cost}`)
            .style("opacity", 0.9)
            .style("top", event.pageY - 10 + "px")
            .style("left", event.pageX + 10 + "px");
        })
        .on("mouseout", (event, d) => {
            tooltip.style("opacity", 0);
        });

        //creating the lables in each node to identify which place it is.
        const labels = node_content.selectAll("text")
        .data(nodes)
        .join("text")
        .text(d => d.name + " ID "+ d.id)
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .on("mouseover", (event, d) => {
            //console.log("tooltip");
            tooltip.html(`<strong>${d.name} ID ${d.id}</strong><br>
            ID: ${d.id}<br>
            Type: ${d.name}<br>
            Cost: $${d.cost}`)
            .style("opacity", 0.9)
            .style("top", event.pageY - 10 + "px")
            .style("left", event.pageX + 10 + "px");
        })
        .on("mouseout", (event, d) => {
            tooltip.style("opacity", 0);
        });

    var creatediagram = d3.forceSimulation(nodes)
    .force("link", d3.forceLink().id(d => d.id)
        .links(links)
        .distance(100))
        //this controls the gap btw nodes
    .force("charge", d3.forceManyBody().strength(-100))
    //this controls the position of center node for rendering
    .force("center", d3.forceCenter(nodeWidth/2, nodeHeight/2))
    .on("end", ticked);


        //giving cordinates of the things to print based on the lasso selection.
        function ticked(){
            link.attr("x1", function(d) { return xScale1(d.source.xValue); })
              .attr("y1", function(d) { return yScale1(d.source.yValue); })
              .attr("x2", function(d) { return xScale1(d.target.xValue); })
              .attr("y2", function(d) { return yScale1(d.target.yValue); });
            node.attr("cx", function(d) { return xScale1(d.xValue); })
              .attr("cy", function(d) { return yScale1(d.yValue); });
            labels.attr("x", d => xScale1(d.xValue))
            .attr("y", d => yScale1(d.yValue));
        }
        //Adding legend
        const legend = node_svg.append("g")
            .attr("transform", `translate(${nodeMargin.left/2}, ${nodeMargin.top/2})`);

    const legendtype = legend.selectAll("g")
        .data(colorScale.domain())
        .join("g")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`)
        .style("fill", "white");
        
    // adding key circles to the legend

    legendtype.append("circle")
        .attr("cx", 10)
        .attr("cy", 10)
        .attr("r", 5)
        .attr("fill", colorScale);


        // adding text to the legend
        legendtype.append("text")
            .attr("x", 20)
            .attr("y", 14.5)
            .style("fill", colorScale)
            .text(d => "< $" + d);

        createZoomBehavior(node_svg, node_content);
}

function createZoomBehavior(svg, content) {
    const zoom = d3.zoom()
        .scaleExtent([0.5, 10]) // Adjust this array to set the minimum and maximum zoom levels
        .on("zoom", (event) => {
            content.attr("transform", event.transform);
        });

    svg.call(zoom);
}