var width = 760,
    height = 500;

var crs = new L.Proj.CRS('EPSG:3005',
            '+proj=aea +lat_1=50 +lat_2=58.5 +lat_0=45 +lon_0=-126 +x_0=1000000 +y_0=0 +ellps=GRS80 +datum=NAD83 +units=m +no_defs', {
        resolutions: [
            4592, 3000, 1648, 1024, 512, 256, 128,
            64, 32, 16, 8, 4, 2, 1, 0.5
        ],
        origin: [0, 0]
    }),
    southWest = L.latLng(46.851760, -142.734375),
    northEast = L.latLng(60.364901, -114.917969),
    bounds = L.latLngBounds(southWest, northEast);

var map = new L.Map('map', {
    crs: crs,
    continuousWorld: true,
    worldCopyJump: false,
    maxBounds: bounds
});

map.setView([54, -122.9364], 1);


function ready(error, canada, usa, ocean) {
    "use strict";
    if (error) { 
        return console.error(error);
    }


    function brushed() {

        var value = brush.extent()[0];

        if (d3.event.sourceEvent) {

            value = Math.round(x.invert(d3.mouse(this)[0]));
            brush.extent([value, value]);
        }
        handle.attr("cx", x(value));
        var brushDate = brushToMonth(value);
        current.month = brushDate;
        map.removeLayer(wmsL); // remove layer to prevent them from piling up.


        drawMap(brushDate, climate_var);

    }

    var x = d3.scale.linear()
        .domain([1, 13])
        .range([0, sliderWidth])
        .clamp(true);

    var brush = d3.svg.brush()
        .x(x)
        .extent([current.month, current.month])
        .on("brush", brushed);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("button")
        .ticks(13)
        .tickFormat(function (d) {
            return xTicks[d];
        })
        .tickSize(10, 0)
        .tickPadding(0);


    var svg = d3.select(map.getPanes().overlayPane).append("svg"),
        g = svg.append("g").attr("class", "leaflet-zoom-hide");

    var pacific = topojson.feature(ocean, ocean.objects.ocean);

    // first variable is used to center and scale map the viewport
    var bTopo = topojson.feature(canada, canada.objects.canada),
        topo = bTopo.features;
    var usTopo = topojson.feature(usa, usa.objects.counties);
    // var usaTopo = topojson.feature(usa, usa.objects.states);

    svg.selectAll("path")
        .data(topo)
        .enter()
        .append("path");

    var transform = d3.geo.transform({
            point: projectPoint
        }),
        path = d3.geo.path().projection(transform);

    var feature = g.selectAll("path")
        .data(bTopo.features)
        .enter()
        .append("path")
        .attr("class", "canada")
        .attr("id", "land");

    function reset() {
        console.log('adding this make things work in safari...')

        var bounds = path.bounds(usTopo), //Use US for the projection bounds
            topLeft = bounds[0],
            bottomRight = bounds[1];

        svg.attr("width", bottomRight[0] - topLeft[0])
            .attr("height", bottomRight[1] - topLeft[1])
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px");

        g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

        feature.attr("d", path)
            .style("fill", function (d) {
                // console.log(d)
                if (d.properties.province === "British Columbia") {
                    return "none";
                }
                return "#ddd";
            });

        // featureUSA.attr("d", path); //state borders

        featureUS.attr("d", path) //make these counties (Alaska panhandle and San Juan Islands) visible. 
            .style("fill", function (d) {
                if (d.id === "02105" || d.id === "02100" || d.id === "02230" || d.id === "02110" || d.id === "02220" || d.id === "02195" || d.id === "02275" || d.id === "02198" || d.id === "02130" || d.id === "53055") 
                {
                return "none";
                }
                return "#ddd";
            });

        ocean.attr("d", path)
            .style("fill", "#a6cef5");

    }

    map.on("viewreset", reset);

    var featureUS = g.selectAll("path1")
        .data(usTopo.features)
        .enter().append("path");

    // var featureUSA = g.selectAll("path1")
    //     .data(usaTopo.features)
    //     .enter().append("path")
    //     .attr("class", "us");

    ocean = g.selectAll("path2") // only using to mask tiles that spill over boarder. Could clip tiles instead...
        .data(pacific.features)
        .enter().append("path")
        .attr("class", "ocean");

    // console.log(current.month)
    climate_var = "tmax";



    drawMap(current.month, climate_var); //initialize with Jan and tmax

    sliderContainer.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + sliderHeight / 2 + ")")
        .call(d3.svg.axis()
            .scale(x)
            .orient("button")
            .ticks(12)
            .tickFormat(function (d) {
                return xTicks[d];
            })
            .tickSize(0)
            .tickPadding(12))
        .select(".domain")
        .select(function () {
            return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "halo");


    var tick = sliderContainer.selectAll(".tick")
      .each(function () { 
        this.parentNode.appendChild(this);});

   
    tick.filter(function (d) { 
        return d in xTicks; })
        .attr("class", function (d) { 
        return "tick tick-special tick-" + xTicks[d].toLowerCase();});

    sliderContainer.call(xAxis);

    var slider = sliderContainer.append("g")
        .attr("class", "g-slider")
        .call(brush);

    slider.selectAll(".extent, .resize").remove();

    slider.select(".background")
        .attr("height", sliderHeight);

    var handle = slider.append("circle")
        .attr("class", "handle")
        .attr("transform", "translate(0," + sliderHeight / 2 + ")")
        .attr("r", 9);


    reset();


    // trace selection
    $(document).ready(function () {
        $('.climate_var').on('change', function () {
            climate_var = $('.climate_var').val();

            map.removeLayer(wmsL); // remove layer to prevent them from piling up.
            drawMap(current.month, climate_var, day);

        });

    });

    makeChart();

}

queue()
    .defer(d3.json, "canada.json")
    .defer(d3.json, "usa.json")
    .defer(d3.json, "ocean.json")
    .await(ready);

var e, ymin, ymax, climate_var;

var sliderWidth = 250,
    sliderHeight = 30;
var wmsL, day;

var margin = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
};

var current = {
        "month": 1
    },
    maxValue = 13,
    moving;

var sliderContainer = d3.select("#slider").append("svg")
    .attr("width", sliderWidth + margin.left + margin.right + 10)
    .attr("height", sliderHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + (margin.top) + ")");

var brushToMonth = d3.scale.quantile()
    .domain([1, 13])
    .range([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);

var xTicks = {
    "1": "Jan",
    "2": "",
    "3": "Mar",
    "4": "",
    "5": "May",
    "6": "",
    "7": "Jul",
    "8": "",
    "9": "Sep",
    "10": "",
    "11": "Nov",
    "12": "",
    "13": "Ann"
};


var svgLeg = d3.select("#legMain").append("svg")
    .attr("width", 600)
    .attr("height", 450);


function projectPoint(x, y) {
    "use strict";
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
}

function drawMap(date, climate_var, day) {
    "use strict";
    // console.log(date)
    if (day === undefined) {
        day = '15';
    } 
    if (date === 13) { //annual values
        date = 6;
        day = 30;
        }; 

    var y = d3.scale.log()
        .range([150, 0]);

    var yAxis = d3.svg.axis()
        .scale(y)
        .ticks(5, ",.1")
        .orient("right");

    switch (climate_var) {

    case 'pr':

        $.ajax({
            url: "http://tools.pacificclimate.org/dataportal/bc_prism/metadata.json?request=GetMinMaxWithUnits",
            data: "&id=pr_monClim_PRISM_historical_run1_197101-200012&var=pr",
            success: function (data) {

                svgLeg.selectAll("image").remove();
                svgLeg.selectAll("g").remove();

                if (wmsL !== undefined) {
                    map.removeLayer(wmsL);
                }
                ymax = data.max / 4;

                if (day === 30) {
                    ymax = data.max;}
                
                ymin = data.min;
                y.domain([ymin, ymax]);

                svgLeg.append("g")
                    .attr("class", "y axisC colourY")
                    .call(yAxis)
                    .attr("transform", "translate(90,30)")
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 46)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .text("Precipitation (mm)");


                svgLeg.append("image")
                    .attr("clip-path", "url(#clip)")
                    .attr("xlink:href", "http://tools.pacificclimate.org/ncWMS-PCIC/wms?REQUEST=GetLegendGraphic&COLORBARONLY=true&WIDTH=1&HEIGHT=13&PALETTE=occam_inv&NUMCOLORBANDS=254&COLORSCALERANGE=" + ymin + "," + ymax + '"')
                    .attr("width", 150)
                    .attr("height", 150)
                    .attr("transform", "translate(10,30)");

                wmsL = L.tileLayer.betterWms("http://tools.pacificclimate.org/ncWMS-PCIC/wms", {
                    layers: climate_var + '_monClim_PRISM_historical_run1_197101-200012/' + climate_var,
                    format: 'image/png',
                    maxZoom: 14,
                    minZoom: 0,
                    transparent: 'true',
                    month: date,
                    time: '1985-' + date + '-' + day,
                    styles: 'boxfill/occam_inv',
                    COLORSCALERANGE: ymin + "," + ymax,
                    logscale: true,
                    numcolorbands: 254,
                    version: '1.1.1',
                    continuousWorld: true
                });

                ymax = data.max / 4;
                // console.log(wmsL)

                wmsL.addTo(map);

            }
        });

        break;

    case 'tmax':
    case 'tmin':

        y = d3.scale.linear()
            .range([150, 0]);

        yAxis = d3.svg.axis()
            .scale(y)
            .ticks(5)
            .orient("right");

        $.ajax({
            url: "http://tools.pacificclimate.org/dataportal/bc_prism/metadata.json?request=GetMinMaxWithUnits",
            data: "&id=tmax_monClim_PRISM_historical_run1_197101-200012&var=tmax",
            success: function (data) {
                console.log(data)

                svgLeg.selectAll("image").remove();
                svgLeg.selectAll("g").remove();

                if (wmsL !== undefined) {
                    map.removeLayer(wmsL);
                }

                ymax = data.max;
                ymin = data.min - 5; //expand range to capture tmin values without having to do another ajax request. 
                console.log(ymin)
                y.domain([ymin, ymax]);

                svgLeg.append("g")
                    .attr("class", "y axisC colourY")
                    .call(yAxis)
                    .attr("transform", "translate(90,30)")
                    .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 36)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .text("Temperature (\xB0C)");

                svgLeg.append("image")
                    .attr("clip-path", "url(#clip)")
                    .attr("xlink:href", "http://tools.pacificclimate.org/ncWMS-PCIC/wms?REQUEST=GetLegendGraphic&COLORBARONLY=true&WIDTH=1&HEIGHT=13&PALETTE=boxfill/rainbow'&NUMCOLORBANDS=254&COLORSCALERANGE=" + ymin + "," + ymax + '"')
                    .attr("width", 150)
                    .attr("height", 150)
                    .attr("transform", "translate(10,30)");

                wmsL = L.tileLayer.betterWms("http://tools.pacificclimate.org/ncWMS-PCIC/wms", {
                    layers: climate_var + '_monClim_PRISM_historical_run1_197101-200012/' + climate_var,
                    format: 'image/png',
                    maxZoom: 14,
                    minZoom: 0,
                    transparent: 'true',
                    month: date,
                    time: '1985-' + date + '-' + day,
                    styles: 'boxfill/rainbow',
                    COLORSCALERANGE: ymin + "," + ymax,
                    logscale: false,
                    numcolorbands: 254,
                    version: '1.1.1',
                    continuousWorld: true
                });

                wmsL.addTo(map);
            }
        });

        break;
    }

}

// function annual() {
//     day = "30";
//     current.month = "6";
//     drawMap(current.month, climate_var,day);
// }


//set up vars for chart. Need to be accessed in L.TileLayer.BetterWMS
var counter = 0,
    svg,
    AvgLine,
    xAxis,
    yAxis,
    x;

margin = {
    top: 20,
    right: 20,
    bottom: 30,
    left: 50
};

var widthG = 760 / 2 - margin.left - margin.right,
    heightG = 250 - margin.top - margin.bottom;

var parseDate = d3.time.format("%Y-%m-%d").parse;


function makeChart() {
    "use strict";

    //setup graph but hide it.

    var chartData = [];


    x = d3.time.scale()
        .domain([d3.extent(chartData, function (d) {
            return d.x;
        })])
        .range([0, widthG]);

    var y = d3.scale.linear()
        .range([heightG, 0]);

    xAxis = d3.svg.axis()
        .scale(x)
        .ticks(11)
        .orient("bottom")
        .tickFormat(d3.time.format("%b"));

    yAxis = d3.svg.axis()
        .scale(y)
        .ticks(5, ",.1")
        .orient("left");

    var line = d3.svg.line()
        .interpolate("linear")
        .x(function (d) {
            return x(d.x);
        })
        .y(function (d) {
            return y(d.y);
        });

    var meanLine = d3.svg.line()
        .x(function (d) {
            return x(d.x);
        })
        .y(function (d) {
            return y(d.y);
        });

                    

    svg = d3.select("#chart").append("svg")
        .attr("width", widthG + 100 + margin.left + margin.right)
        .attr("height", heightG + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    y.domain([0, 0]);

    svg.append("g") //x axis group
        .attr("class", "x axisC")
        .attr("transform", "translate(0," + heightG + ")")
        .call(xAxis);

    svg.append("path")
        .attr("class", "line")
        .attr("d", line(chartData));

    AvgLine = svg.append("g");

    AvgLine.append("path")
        .attr("class", "line1")
        .attr("d", meanLine(chartData));

    svg.selectAll("circle")
        .data(chartData)
        .enter()
        .append("circle")
        .attr("r", 3.5)
        .attr("cx", function (d) {
            return x(d.x);
        })
        .attr("cy", function (d) {
            return y(d.y);
        })
        .style("fill", "rgb(214,39,40)");
}