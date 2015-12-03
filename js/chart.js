var margin = {top: 10, right: 30, bottom: 30, left: 30};
var pwidth;
var pheight;
var poly;
var points0;
var tooltip;

function setPlotWidth() {
    pwidth =  document.getElementById('chart1').offsetWidth - margin.left - margin.right;
    pheight = document.getElementById('chart1').offsetHeight - margin.top - margin.bottom;
    tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 1.0)
        .style("visibility", "hidden");
}

function plotTemperature(rawDataHi, rawDataLo) {
    var width =  document.getElementById('chart-temp').offsetWidth - margin.left - margin.right;
    var height = document.getElementById('chart-temp').offsetHeight - margin.top - margin.bottom;
    var color = d3.scale.ordinal()
        .domain(["Low", "High"])
        .range(["#6b486b", "#ff8c00"]);
    var data = [];
    var tmax=0, tmin=100;
    var month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    for (var i=0; i < rawDataHi.length; i+=3) {
        var meanHi = (rawDataHi[i].value + rawDataHi[i+1].value + rawDataHi[i+2].value)/10./3.*1.8 + 32;
        var meanLo = (rawDataLo[i].value + rawDataLo[i+1].value + rawDataLo[i+2].value)/10./3.*1.8 + 32;
        var lo = {'name': 'Low', 'y0': 0, 'y1': meanLo};
        var hi = {'name': 'High', 'y0': meanLo, 'y1': meanHi};
        data.push({'temp': [lo, hi], 'month': month[i/3]});
        if (meanHi > tmax) tmax = meanHi;
        //if (meanLo < tmin) tmin = meanLo;
    }
    //tmin -= 5;
    tmin = 0;
    tmax += 5;
    var xScale = d3.scale.ordinal()
        .domain(data.map(function(d){ return d["month"]; }))
        .rangeRoundBands([0, width], .1);
    var yScale = d3.scale.linear()
        .domain([tmin, tmax])
        .range([height, 0]);

    var svg = d3.select('#chart-temp').append('svg')
        .attr('width', width + margin.right + margin.left)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var xBinwidth = width / data.length *0.9;

    var month = svg.selectAll(".month")
         .data(data)
         .enter().append("g")
         .attr("class", "g")
         .attr("transform", function(d) { return "translate(" + xScale(d.month) + ",0)"; });

    month.selectAll("rect")
         .data(function(d) { return d.temp; })
         .enter().append("rect")
         .attr("width", function(d) { return xBinwidth })
         .attr("y", function(d) { return yScale(d.y1); })
         .attr("height", function(d) { return yScale(d.y0) - yScale(d.y1); })
         .style("fill", function(d) { return color(d.name); });

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.svg.axis().scale(xScale).orient("bottom"));

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .ticks(8)
        .orient("left");
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Temperature (F)");

    var legend = svg.selectAll(".legend")
       .data(color.domain().slice().reverse())
       .enter().append("g")
       .attr("class", "legend")
       .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);
    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });

}

function initDraw(chart,col,xlabel,format,tipFormat) {
    var xScale = d3.scale.linear()
        .range([0, pwidth]);
    var hist;
    var binwidth;
    if (transitFlag && col === 'time') {
        xScale.domain([0, 1.001*d3.max(markers.filter(filterTime), function(d) { return d[col]; })]);
        binwidth = xScale.domain()[1]/10.;
        hist = d3.layout.histogram()
               .bins(d3.range(xScale.domain()[0], xScale.domain()[1]+0.5*binwidth, binwidth))
               (markers.filter(filterTime).map(function(d) {return d[col]; }));
    } else {
        xScale.domain([0, 1.001*d3.max(markers, function(d) { return d[col]; })]);
        binwidth = xScale.domain()[1]/10.;
        hist = d3.layout.histogram()
               .bins(d3.range(xScale.domain()[0], xScale.domain()[1]+0.5*binwidth, binwidth))
               (markers.map(function(d) {return d[col]; }));
    }
    var yScale = d3.scale.linear()
        .range([pheight, 0])
        .domain([0, d3.max(hist, function(d) { return d.y; })]);
    //alert(col+' '+d3.max(markers, function(d) { return d[col]; })+' '+d3.min(markers, function(d) { return d[col]; }));

    var xAxis = d3.svg.axis()
       .scale(xScale)
       .orient("bottom")
       .tickFormat(d3.format(format));

    var svg = d3.select('#'+chart).append('svg')
        .attr('width', pwidth + margin.right + margin.left)
        .attr('height', pheight + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var xBinwidth = pwidth / hist.length *0.93;
    yScale.domain([0, d3.max(hist, function(d) { return d.y; })]);

    svg.selectAll(".bar")
        .data(hist)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("width", function(d) { return xBinwidth })
        .attr("height", function(d) { return pheight- yScale(d.y); })
        .attr("x", function(d) {return xScale(d.x)})
        .attr("y", function(d) {return yScale(d.y)});

    svg.selectAll(".text")
        .data(hist)
        .enter()
        .append("text")
        .attr("class", "text")
        .attr("x", function(d) {return xScale(d.x + binwidth/2)})
        .attr("y", function(d) {return yScale(d.y) + 14})
        .attr("text-anchor", "middle")
        .text(function(d) { return d.y; });

    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", pwidth/2)
        .attr("y", pheight + margin.bottom-3)
        .text(xlabel);

    var drag = d3.behavior.drag()
       .on("dragstart", dragstarted)
       .on("drag", dragmove)
       .on("dragend", dragended);

    poly = [{"x":pwidth-5, "y":0},
         {"x":pwidth+5,"y":0},
         {"x":pwidth+5,"y":10},
         {"x":pwidth,"y":15}, {"x":pwidth-5, "y":10}];
    points0 = poly.map(function(d) { return [d.x,d.y].join(","); }).join(" ");
    var boundary = document.getElementById(chart).getBoundingClientRect();

    svg.selectAll("polygon")
     .data([poly])
     .enter().append("polygon")
     .attr("points", points0)
     .attr("scale",xScale.domain()[1]/pwidth)
     .attr("x0",pwidth)
     .attr("col",col)
     .attr("prev",pwidth)
     .attr("cursor", "move")
     .attr("tipformat", tipFormat)
     .attr("tipxmin", boundary.left + margin.left)
     .attr("tipxmax", boundary.right - margin.right)
     .call(drag);

    bounds[col] = xScale.domain()[1];

    // draw the x axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + pheight + ")")
        .call(xAxis);

}

function dragstarted() {
    var y0 = d3.event.sourceEvent.pageY - 35;
    tooltip.style("top", y0 + "px")
           .style("visibility", "visible");
}

function dragmove() {
    var obj = d3.select(this);
    var x = Math.max(0, Math.min(pwidth, d3.event.x));
    var dx = x - pwidth;
    var points = poly.map(function(d) { return [d.x+dx,d.y].join(","); }).join(" ");
    var scale = obj.attr("scale");
    var textFormat = d3.format(obj.attr("tipformat"));
    var x0 = Math.max(obj.attr("tipxmin"), Math.min(d3.event.sourceEvent.pageX, obj.attr("tipxmax")));

    d3.select(this)
        .attr("points", points)
        .attr("x0", x);

    tooltip.style("left", x0 + "px")
        .text(textFormat(x*scale));
}

function dragended() {
    var obj = d3.select(this);
    var col = obj.attr("col");
    var x = +obj.attr("x0");   // convert string to float
    var prev = +obj.attr("prev");
    bounds[col] = x*obj.attr("scale");
    if (x < prev) {
        hideMarkers(col);
    } else if (x > prev) {
        showMarkers();
    }
    obj.attr("prev", x);
    tooltip.transition()
       .duration(100)
       .style("visibility", "hidden");
}

function drawHist(chart,col,format) {
    var xScale = d3.scale.linear()
        .range([0, pwidth]);
    var hist;
    var binwidth;
    if (transitFlag && col === 'time') {
        xScale.domain([0, 1.001*d3.max(markers.filter(filterTime), function(d) { return d[col]; })]);
        binwidth = xScale.domain()[1]/10.;
        hist = d3.layout.histogram()
           .bins(d3.range(xScale.domain()[0], xScale.domain()[1]+0.5*binwidth, binwidth))
           (markers.filter(filterTime).map(function(d) {return d[col]; }));
    } else {
        xScale.domain([0, 1.001*d3.max(markers, function(d) { return d[col]; })]);
        binwidth = xScale.domain()[1]/10.;
        hist = d3.layout.histogram()
           .bins(d3.range(xScale.domain()[0], xScale.domain()[1]+0.5*binwidth, binwidth))
           (markers.map(function(d) {return d[col]; }));
    }
    var yScale = d3.scale.linear()
        .range([pheight, 0])
        .domain([0, d3.max(hist, function(d) { return d.y; })]);
    var xBinwidth = pwidth / hist.length *0.93;

    var svg = d3.select('#'+chart+' svg')
    var bar = svg.selectAll(".bar").data(hist);
    bar.exit().remove();
    bar.enter().append("rect")
        .attr("class", "bar");
    bar.attr("height", function(d) { return pheight- yScale(d.y); })
       .attr("width", function(d) { return xBinwidth; })
       .attr("x", function(d) {return xScale(d.x)})
       .attr("y", function(d) {return yScale(d.y)});

    var text = svg.selectAll(".text").data(hist);
    text.exit().remove();
    text.enter().append("text")
        .attr("class", "text");
    text.attr("x", function(d) {return xScale(d.x + binwidth/2)})
        .attr("y", function(d) {return yScale(d.y) + 14 })
        .attr("text-anchor", "middle")
        .text(function(d) { return d.y; });

    svg.select("polygon")
        .attr("points", points0)
        .attr("scale",xScale.domain()[1]/pwidth)
        .attr("x0",pwidth)
        .attr("prev",pwidth);

    bounds[col] = xScale.domain()[1];

    var xAxis = d3.svg.axis()
       .scale(xScale)
       .orient("bottom")
       .tickFormat(d3.format(format));
    svg.select(".x.axis").call(xAxis);

}

function reset(chart) {
    var svg = d3.select('#'+chart+' svg');
    svg.select("polygon")
        .attr("points", points0)
        .attr("x0",pwidth)
        .attr("prev",pwidth);
}

function filterTime(d) {
    if ( d['time'] < bounds['time'] ) {
      return true;
    } else {
        //alert(d['time']+' '+d['address']);
      return false;
    }
}

