var globalData;
var ranData;

// svg
const width = 1076, height = 1144;
var margin_1 = { top: 40, right: 40, bottom: 40, left: 40 };
var width_1 = width - margin_1.left - margin_1.right;
var height_1 = height - margin_1.top - margin_1.bottom;

var firstDate = new Date(1991,0,1), lastDate = new Date(2024,0,1);
var g, defs;

// global data for context and focus
var xAxisC,yAxisC,xScaleC,yScaleC;
var svgC;
var brush;
var timeData;
var marginC, heightC,widthC, heightF;

marginC = {top: 10, right: 40, bottom: 90, left: 40},
widthC = width + width,
heightC = 200 - marginC.top - marginC.bottom;

heightF = 400 - marginC.top - marginC.bottom;

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

// info for innovative data
var purposes = ["Coming Back From Restaurant", "Eating", "Going Back to Home", "Recreation (Social Gathering)", "Work/Home Commute"]
const color = d3.scaleOrdinal()
    .domain(purposes)
    .range(d3.schemePaired);

// this function is called when the page is loaded
document.addEventListener('DOMContentLoaded', function () {
    svg = d3
        .select("#my_dataviz")
        .append("svg")
        .attr("width", width_1 + margin_1.left + margin_1.right)
        .attr("height", height_1 + margin_1.top + margin_1.bottom)
        .attr("id","chart-svg");

    d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
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

    plotMapPoints("2022-03-01");
    

    svgC = d3.select("#context-focus")
        .append("svg")
        .attr("width", widthC + marginC.left + marginC.right)
        .attr("height", heightC + marginC.top + marginC.bottom)
        .append("g")

    svgF = d3.select("#context-focus")
        .append("svg")
        .attr("width", widthC + marginC.left + marginC.right)
        .attr("height", heightF + marginC.top + marginC.bottom)
        .append("g")

    xScaleC = d3.scaleTime().range([0, widthC - marginC.right]);
    xAxisC = svgC.append("g").attr("transform", "translate(30," + heightC + ")");
    yScaleC = d3.scaleLinear().range([heightC, 0]);
    yAxisC = svgC.append("g").attr("transform", "translate(30,0)");

    xScaleF = d3.scaleTime().range([0, widthC - marginC.right]);
    xAxisF = svgF.append("g").attr("transform", "translate(30," + heightF + ")");
    yScaleF = d3.scaleLinear().range([heightF, 0]);
    yAxisF = svgF.append("g").attr("transform", "translate(30,0)");
  
    Promise.all([
        d3.json("http://127.0.0.1:5000/getTravelTime")
    ]).then(function (data) {

        timeData = data[0]

        timeData.forEach(d => {

            d.date = new Date (d.date);
            d.value = d.value/3600;  
        });

        drawaxisC(timeData);
        drawDataC(timeData);

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

    /* console.log("Draw Map")
    console.log(allData) */

    for(var i = 0; i < allData.length; i++){ // find which group of data to graph
        if(allData[i][0].time == currentTime){
            data = allData[i] 
            // console.log("match")
            // console.log(currentTime)
            // console.log(allData[i][0].time)
            break;
        }
    }
/*     console.log("Data: ", data)
    console.log("Data Start Time: ", data[0].time)
    console.log("Data Start Time: ", data[data.length-1].time)
    console.log(0,d3.max(data, d=>d.yLoc)) */

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
                    //console.log(d)
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
        selectedParticipants = selectedDots // This is a list of selected participant IDs
        innovativeChart() // add chart function here if you want to update your chart with lasso select
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

function parseInnovativeData(participant){
    var data = []
    // selected is list of participant ids
    // travel data is travel journal data for the selected day
    // console.log("TravelData: ", travelData)
    for(var j = 0; j<travelData.length; j++){    
        if(travelData[j].participantId == participant){
            data.push(travelData[j])
        }
    }
    return data;
}


function innovativeChartDirections(){
    // Add labels and titles       
    
    d3.select("#innovativeInfo").select(".innSVG").remove()
    var svgInnTitle = d3.select("#innovativeInfo")
        .append("svg")
        .attr("class", "innSVG")
        .attr("width", width_1 + margin_1.left + margin_1.right - 10)
        .attr("height",140);

    // format for title
    var formatTitle = d3.timeFormat("%a %b %d %Y")
    svgInnTitle.append("text") // title
        .attr('transform', 'translate('+400+', '+27.5+')')
        .style('text-anchor', 'middle')
        .style("fill","Black")
        .style('font-size', 25)
        .attr('class','text')
        .text("Traveling Logs of Particpants During the Day: " + formatTitle(globalData[0].date));

    svgInnTitle.append("text") // directions
        .attr('transform', 'translate('+400+', '+47.5+')')
        .style('text-anchor', 'middle')
        .style("fill","Black")
        .style('font-size', 12)
        .attr('class','text')
        .text("(Use lasso on map to select participants)");

    svgInnTitle.append("text") // sub title
        .attr('transform', 'translate('+35+', '+65+')')
        .style('text-anchor', 'left')
        .style("fill","Black")
        .style('font-size', 18)
        .attr('class','text')
        .text("Purposes of Travel:");

    // add color labels
    for(var i = 0; i<purposes.length;i++){
        svgInnTitle.append("text") // purpose
            .attr('transform', 'translate('+(50 + 220*Math.floor(i/2))+', '+(90 +25*(i%2))+')')
            .style('text-anchor', 'right')
            .style("fill","Black")
            .style('font-size', 12)
            .attr('class','text')
            .text(purposes[i]);
        svgInnTitle.append("rect") // color
            .attr('transform', 'translate('+(35 + 220*Math.floor(i/2))+', '+(80 +25*(i%2))+')')
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', color(purposes[i]));
    }
}

function innovativeChart(){ // Create innovative chart with selected data points
    // clear previous
    d3.select("#innovativeDiv").selectAll("*").remove();
    // make chart for each selected
    // console.log("Selected: ", selected)
    for(var i =0; i < selectedParticipants.length; i++){

        var svgInn = d3.select("#innovativeDiv")
            .append("svg")
            .attr("class", "innSVG")
            .attr("width", width_1 + margin_1.left + margin_1.right - 20)
            .attr("height", 150)

        svgInn.append('image')
            .attr('xlink:href', 'Basic_human_drawing.png')
            .attr("x",10)
            .attr("y",10)
            .attr('width', 50)
            .attr('height', 100);

        svgInn.append("text")
            .attr('class','innovated'+selectedParticipants[i])
            .attr("x",70)
            .attr("y",60)
            .text("ID: #" + selectedParticipants[i])
        
///////////////////////// Making gantt chart/////////////       
        dataBar = parseInnovativeData(selectedParticipants[i]) // get travel entries for participant i
        //console.log("DataBar: ", dataBar);
        ///////////// Make Chart
        var widthInn = width_1 + margin_1.left + margin_1.right - 20 - 200;
        var heightInn = 100
        var marginInn = {top:20, bottom:20,left:100, right:50}
        var innerHInn = heightInn - marginInn.top - marginInn.bottom

        // get the first and last time of the date (should still work if global data is still only looking at current day's timestamps)
        var times = d3.extent(globalData, d => d.timestamp);
        var startTime = parseTime(times[0]);
        var endTime = parseTime(times[1]);

        // Get the scales
        var xScale2 = d3.scaleTime()
            .domain([startTime, endTime])
            .range([0, widthInn])
        if(dataBar.length != 0){
            var yScale2 = d3.scaleBand()
                .domain([dataBar[0].participantId,dataBar[0].participantId])
                .range([-innerHInn,0])

            // add tool tip

            var div = d3.select(".tooltip");
            
            // add rectangles for travel blocks
            svgInn.selectAll("timeRect")
                .data(dataBar)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("y", function(d) { return yScale2(d.participantId) ; })
                .attr("height", 30)
                .attr("x", function(d) { return xScale2(d.dateStart); })
                .attr("width", function(d) { return xScale2(d.dateEnd) - xScale2(d.dateStart); })
                .attr("fill", function(d) { return color(d.purpose)})
                .attr("transform", "translate(140, " + (heightInn) + ")")
                .on('mouseover', function(event,d){
                    console.log(d.purpose)
                    div.transition()
                        .duration(200)
                        .style("opacity", .75);
                    console.log(event)
                    div.html("Purpose: " + d.purpose + "<br/>" 
                        +  "From " + formatTime(d.dateStart) + " to " + formatTime(d.dateEnd))
                        .style("left", (event.pageX - 110) + "px")
                        .style("top", (event.pageY - 85) + "px");
                })
                .on('mousemove', function(event,d){
                    div.transition()
                        .duration(200)
                        .style("opacity", 1);
                    div.html("Purpose: " + d.purpose + "<br/>" 
                        +  "From " + formatTime(d.dateStart) + " to " + formatTime(d.dateEnd))
                        .style("left", (event.pageX - 100) + "px")
                        .style("top", (event.pageY - 75) + "px");
                })
                .on("mouseout", function(d) {
                    div.transition()
                        .duration(500)
                        .style("opacity", 0);
                })
        }
        // add axis
        svgInn.append("g")
            .attr("transform", "translate(140," + (heightInn-20) + ")")
            .call(d3.axisBottom(xScale2).ticks(20).tickSize(-50).tickFormat(d3.timeFormat("%H"))).style("stroke-dasharray", "5 5");   
        
    }    
}


///////////////////////// Making Context and Focus Chart/////////////   

function drawaxisC(data){
    xScaleC.domain([
        new Date(
            d3.min(data, function (d) {
                return d.date;
            })
        ),
        new Date(
            d3.max(data, function (d) {
                return d.date;
            }) + 3
        ),
    ]);
    
    var max_data = d3.max(data, function (d) {
        return d.value;
    });
  
    yScaleC.domain([0, max_data]);
    
    xAxisC.transition().duration(1000).call(d3.axisBottom(xScaleC));
  
    yAxisC.transition().duration(1000).call(d3.axisLeft(yScaleC));
  
}


function drawaxisF(data){
    xScaleF.domain([
        new Date(
            d3.min(data, function (d) {
                return d.date;
            })
        ),
        new Date(
            d3.max(data, function (d) {
                return d.date;
            }) + 3
        ),
    ]);
    
    
    var max_data = d3.max(data, function (d) {
        return d.value;
    });
  
    yScaleF.domain([0, max_data]);
    
    xAxisF.transition().duration(1000).call(d3.axisBottom(xScaleF));
  
    yAxisF.transition().duration(1000).call(d3.axisLeft(yScaleF));
  
}


function drawDataC(data){

    svgC.append("path")
        .datum(data)
        .attr("fill", "blue")
        .attr("stroke", "steelblue")
        .attr("transform", "translate(30,0)")
        .attr("stroke-width", 1.5)
        .attr("d", d3.area()
            .x(d => xScaleC(d.date))
            .y0(yScaleC.range()[0])
            .y1(d => yScaleC(d.value))
        )

    brush = d3.brushX()                   // Add the brush feature using the d3.brush function
        .extent( [ [30,0], [widthC,200] ] )  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
        .on("end", updateChart)   
    
    svgC
        .append("g")
        .attr("class", "brush")
        .call(brush);
}

function drawDataF(data){

    svgF.selectAll("path").remove();

    svgF.append("path")
        .datum(data)
        .attr("fill", "blue")
        .attr("stroke", "steelblue")
        .attr("transform", "translate(30,0)")
        .attr("stroke-width", 1.5)
        .attr("d", d3.area()
            .x(d => xScaleF(d.date))
            .y0(yScaleF.range()[0])
            .y1(d => yScaleF(d.value))
        )
        .on("click", (event) => {
            var dt = xScaleF.invert(d3.pointer(event)[0])
            var dstring;
            if(dt.getMonth() + 1 < 10){
                dstring = dt.getFullYear() + "-0" + (dt.getMonth() + 1 ) + "-" + dt.getDate();
            }
            else{
                dstring = dt.getFullYear() + "-" + (dt.getMonth() + 1 ) + "-" + dt.getDate();
            }

            plotMapPoints(dstring)
            if(selectedParticipants != null && selectedParticipants.length > 0) innovativeChart()
        })

}

function updateChart(e){
    extent = e.selection
    console.log(timeData)
    filteredData = timeData.filter((d)=>{
        return new Date(d.date) >= new Date(xScaleC.invert(extent[0])) & new Date(d.date) <= new Date(xScaleC.invert(extent[1]))
    })

    drawaxisF(filteredData);
    drawDataF(filteredData);

}

function plotMapPoints(date){
    console.log("Date: ", date)
    Promise.all([
        d3.json("http://127.0.0.1:5000/getPeople/"+date),
        d3.json("http://127.0.0.1:5000/getTravelJournal/"+date)

    ]).then(function (data) {
        
        dataTravel = data[1]
        data = data[0]
        data.forEach(function(d){
            d.date = parseTime(d.timestamp),
            d.time = formatTime(parseTime(d.timestamp)),
            d.xLoc = +d.xLoc,
            d.yLoc = +d.yLoc,
            d.participantId = +d.participantID
        })
        globalData = data
        
        
        dataTravel.forEach(function(d){ // Switch from parseTime2 to parseTime once calling json from server
            d.dateStart = parseTime(d.travelStartTime),
            d.timeStart = formatTime(parseTime(d.travelStartTime)),
            d.dateEnd = parseTime(d.travelEndTime),
            d.timeEnd = formatTime(parseTime(d.travelEndTime)),
            d.purpose = d.purpose,
            d.participantId = d.participantId
        })
        travelData = dataTravel
        //console.log("TravelData: ", travelData)
        allData = new Array(288)
        parseDataDate()
        updateSlider()
        innovativeChartDirections()
        console.log("Done");
    })
}