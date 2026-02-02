const width = 1076, height = 1144;

var margin_1 = { top: 40, right: 40, bottom: 40, left: 40 };
var width_1 = width - margin_1.left - margin_1.right;
var height_1 = height - margin_1.top - margin_1.bottom;

var margin_2 = { top: 40, right: 40, bottom: 40, left: 40 };
var  width_2 =  width - margin_2.left - margin_2.right;
var  height_2 = height/4 - margin_2.top - margin_2.bottom;

var margin_3 = { top: 40, right: 40, bottom: 100, left: 40 };
var  width_3 =  width - margin_3.left - margin_3.right;
var  height_3 = 0.75*height - margin_3.top - margin_3.bottom;

var svg, svgInfo, xScale,yScale, xScale_2, yScale_2;
var xAxisInfo, yAxisInfo;
var x_axis_2, y_axis_2;
var venueData;

var apartmentData;
var averageRent;
var filteredData;
var happinessData;
var dataSelected = []
var selectedParticipants = []

// Set color scale
const colorScale = d3.scaleSequential(d3.interpolateReds).domain([0.4, 2])
const customColorScale = (value) => {
    if (value >= 0.4 && value <= 1.0) {
        return d3.scaleSequential(d3.interpolateReds).domain([0.4, 1])/* .range(["#ffff9c", "#efa536"]) */(value);
    } else if (value > 1 && value <= 1.5) {
        return d3.scaleSequential(d3.interpolateBlues).domain([1, 1.5])/* .range(["#ffaf7a", "#853500"]) */(value);
    } else if (value > 1.5 && value <= 2) {
        return d3.scaleSequential(d3.interpolatePurples).domain([1.5, 2])/* .range(["#fa8072", "#170000"]) */(value);
    }
};


function infoVis(selected, map, filteredData){

    // Used for Lollipop chart to compare average of the selected region vs total average of the city
    // console.log("Selected: ", selected)
    // console.log("Map:", map)
    var averageRent = d3.mean(apartmentData, function(d) { return +d.rentalCost; });
    // console.log("Average Rental Cost: ", averageRent);

    var length = selected.length;
    var selectedSum = 0;
    var selectedAverage = 0;
    map.forEach((v) => {
        selectedSum += parseFloat(v);
    });
    selectedAverage = selectedSum/length;
    // console.log("SS:", selectedSum);
    // console.log("Length:", length);
    // console.log("SA:", selectedAverage); 

    var avgRent = []
    avgRent.push({"Label":"Selected Average", "Value":selectedAverage})
    avgRent.push({"Label":"Total City Average", "Value":averageRent})

    console.log("Avg Rents", avgRent);


    //  Used to get the participants living in the apartments
    // console.log("FD:",filteredData);
    let i = 0;
    while (i < filteredData.length) {
        dict = {}
        // console.log(filteredData[i]);
        dict = filteredData[i];
        
        if (selected.includes(dict["apartmentId"])){
            Array.prototype.push.apply(selectedParticipants, dict["participants"]);
        }
        i++;
    }
    // console.log("Selected Participants Array: ", selectedParticipants.sort())

    // Used to calculate average joviality score
    let j = 0;
    let totalHappiness = 0;
    let countHappiness = 0;
    
    while (j < happinessData.length) {
        dict = {}
        // console.log(happinessData[i]);
        dict = happinessData[j];
        
        if (selectedParticipants.includes(dict["participantId"])){
            totalHappiness += parseFloat(dict["joviality"])
            countHappiness++;
            // console.log("par: ", dict["participantId"])
        }
        j++;
    }
    var averageHappines = []
    averageHappines.push(totalHappiness/countHappiness);
    // console.log("Tot:" , totalHappiness)
    // console.log("Count:" , countHappiness)
    console.log("Avg Jov:" , averageHappines)

    svgInfo.selectAll("*").remove();
    svgLine.selectAll("*").remove();
    svgInfo.attr("width", width_2).attr("height", height_2);
    svgLine.attr("width", width_3).attr("height", height_3 + margin_3.bottom + margin_3.top);


    const xScale = d3.scaleLinear()
    .domain([0, 1])  
    .range([margin_2.left, width_2 - margin_2.right])

    svgInfo.append('g') //the "g" elements is usful to apply transformations to several objects inside the same group
    .call(d3.axisBottom(xScale))
    // .attr('transform', `translate(0,${height_2 - margin_2.bottom})`)
    .attr("transform", "translate(0, 10)")

    
    var imgs = svgInfo
    .selectAll("img")
    .data(averageHappines)
    .enter()
    .append("image")
    .attr("class", "img")
    .attr("xlink:href", function(d){
        if (d < 0.475){
            return "/images/angry.jpeg"
        }
        else if (d >= 0.475 && d < 0.525) {
            return "/images/calm.jpeg"
        }
        else{
            return "/images/happy.jpeg"
        }
    })
    .attr("y", height_2 - margin_2.bottom - 120)
    .attr("width", "125")
    .attr("height", "125")
    .transition()
    .duration(2000)
    .ease(d3.easeBounceOut)
    .attr("x", function(d){
        return xScale(d)
    });


    // Lollipop Chart
    var x = d3.scaleBand()
    .range([ 0, width ])
    .domain(["Selected Average", "Total City Average"])
    .padding(1);
    svgLine.append("g")
    .attr("transform", "translate(0, 718)")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-20,0)")
    .style("text-anchor", "end")
    .style("font-weight", "bold")
    .style("font-size", "14px");

    // Add Y axis
    var y = d3.scaleLinear()
    // .domain([300, 1700])
    .domain([Math.min(selectedAverage, averageRent)-50, Math.max(selectedAverage, averageRent)+50])
    .range([ height_3, 0]);
    svgLine.append("g")
    .attr("transform", "translate(40, 0)")
    .call(d3.axisLeft(y))
    .style("font-weight", "bold")
    .style("font-size", "14px");

    // Lines
    svgLine.selectAll("myline")
    .data(avgRent)
    .enter()
    .append("line")
    .attr("x1", function(d) { return x(d.Label); })
    .attr("x2", function(d) { return x(d.Label); })
    .attr("y1", function(d) { return y.range()[0]; })
    .attr("y2", function(d) { return y.range()[0]; })
    .transition()
    .duration(1000)
    .attr("y1", function(d) { return y(d.Value); })
    // .attr("transform", "translate(0,0)")
    .attr("y2", y.range()[0])
    .attr("stroke-width", "6px")
    .attr("stroke", "blue")


    var dots = svgLine
        .selectAll('dots')
        .data(avgRent)
        .enter()
        .append('circle')
        // .attr('id', (d) => {
        //     return "dots";
        // } )
        .attr('class','dots')
        .attr('cx', function(d){
            return x(d.Label)
        })
        .attr('cy',y(0))
        .transition()
        .duration(1000)
        .attr('cy', function(d){
            return y(d.Value)
        })
        .attr('r', 10)
        .attr("fill", "red");

}





function infoVizData(selected, map){
    Promise.all([
        d3.json("http://127.0.0.1:5000/getXYZ"),
        d3.json("http://127.0.0.1:5000/getJoviality")
      ]).then(function (data) {
        filteredData = data[0];
        happinessData = data[1];
        // console.log("FD: ", filteredData)

        
        infoVis(selected, map, filteredData, happinessData)
    })
}

// Function to plot Apartments to Map
function plotApartments(){
    Promise.all([
        d3.json("http://127.0.0.1:5000/getApartments")
    ]).then(function (data) {
        apartmentData = data[0];
        // console.log("Apartments data: ",apartmentData)  
        
        var averageRent = d3.mean(apartmentData, function(d) { return +d.rentalCost; });
        // console.log("Average Rent: " + averageRent);

        var circles = svg
        .selectAll('apartments')
        .data(apartmentData)
        .enter()
        .append('circle')
        .attr('id', (d) => {
            return "apartment-"+d.apartmentId;
        } )
        .attr('class','apartments')
        // .attr('opacity', 0)
        // // .transition()
        // // .duration(500)
        // // .attr('opacity', 0.5)
        // .transition()
        // .duration(1500)
        // .attr('opacity', 1)
        .attr('cx', function(d){
            return xScale(d.xLoc)
        })
        .attr('cy', function(d){
            return yScale(d.yLoc)
        })
        .attr('r', 5)
        // .attr("r", function(d){
        //     radius = 5 * ( d.rentalCost / averageRent)
        //     console.log("Radius for Apartment ID: " + d.apartmentId + " with Rental cost: " + d.rentalCost + " is:= " + radius/5);
        //     return radius
        // }) 
        .attr("fill", function(d){
            colorVal = (d.rentalCost / averageRent)
            // console.log("CS: ", colorScale(colorVal))
            return colorScale(colorVal)
        }) 
        .attr('stroke', 'black')
        .on("mouseover", function (e, d) {
            d3.select("#tip").transition().duration(150).style("opacity", 1);
            d3.select("#tip")
            .html(
                "<p>Rental Cost: $" +
                d.rentalCost +
                "<br>" +
                "Max Occupancy: " +
                d.maxOccupancy +
                "</p>"
            )
            .style("left", e.pageX + 12 + "px")
            .style("top", e.pageY + "px");
        })
        .on("mouseout", function (e, d) {
            d3.select("#tip").transition().duration(150).style("opacity", 0);
        });
        // .on("click", function (e, d) {
        //   plotData(d.apartmentId,"Apartment ID");
        // });

        let coords = []
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
        circles.attr("fill", function(d){
            colorVal = (d.rentalCost / averageRent)
            return colorScale(colorVal)
        })
        .attr("r",5);
        d3.select("#lasso").remove();
        d3.select("#chart-svg")
            .append("path")
            .attr("id", "lasso");
    }

    function dragMove(event) {
        let mouseX = event.sourceEvent.offsetX;
        let mouseY = event.sourceEvent.offsetY;
        coords.push([mouseX, mouseY]);
        drawPath();
    }

    function dragEnd() {
        let selectedDots = [];
        let map = new Map()
        circles.each((d, i) => {
            let point = [
                xScale(d.xLoc),
                yScale(d.yLoc),
            ];
            if (pointInPolygon(point, coords)) {
                d3.select("#apartment-" + d.apartmentId).attr("fill", "red").attr("r",6);
                selectedDots.push(d.apartmentId);
                dataSelected.push([]);
                map.set(d.apartmentId, d.rentalCost)
            }
            
        });
        // console.log(`select: ${selectedDots}`);
        selected = selectedDots // This is a list of selected apartment IDs
        selectedMap = map
        // console.log("Selected: ", selected)
        // console.log("My Map:= ", selectedMap)
    
        // add chart function here if you want to update your chart with lasso select
        infoVizData(selected, map)

        d3.select("#lasso").remove();
        // console.log("Selected: ", selected)       
    }

    const drag = d3
        .drag()
        .on("start", dragStart)
        .on("drag", dragMove)
        .on("end", dragEnd);
    svg.call(drag); 
    })
}



// Main to create and initializae SVGs - svg and svgInfo
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

    svgLine = d3
    .select("#my_dataviz2")
    .append("svg")
    .attr("class","chart2")
    .attr("width", width_3 + margin_3.left + margin_3.right)
    .attr("height", height_3 + margin_3.top + margin_3.bottom);

    xAxisInfo = svgInfo.append("g").attr("transform", "translate(60," + height_2  + ")");
    yAxisInfo = svgInfo.append("g").attr("transform", "translate(30, 50)");
    
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
        
        plotApartments();
        
    });
});



