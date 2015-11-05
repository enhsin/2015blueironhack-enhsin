var margin = {top: 10, right: 30, bottom: 30, left: 30};
var xAxis;

function initDraw(chart,col,xlabel,format) {
    var width =  document.getElementById(chart).offsetWidth - margin.left - margin.right;
    var height = document.getElementById(chart).offsetHeight - margin.top - margin.bottom;
    var xScale = d3.scale.linear()
        .domain([0, d3.max(markers, function(d) { return d[col]; })])
        .range([0, width]);
    var yScale = d3.scale.linear()
        .range([height, 0]);

    var binwidth = xScale.domain()[1]/10.;
    var hist = d3.layout.histogram()
        .bins(d3.range(xScale.domain()[0], xScale.domain()[1]+0.5*binwidth, binwidth))
        (markers.map(function(d) {return d[col]; }));

    xAxis = d3.svg.axis()
       .scale(xScale)
       .orient("bottom")
       .tickFormat(d3.format(format));

    var svg = d3.select('#'+chart).append('svg')
        .attr('width', width + margin.right + margin.left)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var xBinwidth = width / hist.length *0.9;
    yScale.domain([0, d3.max(hist, function(d) { return d.y; })]);

    svg.selectAll(".bar")
        .data(hist)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("width", function(d) { return xBinwidth })
        .attr("height", function(d) { return height- yScale(d.y); })
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
        .attr("x", width/2)
        .attr("y", height + margin.bottom-3)
        .text(xlabel);

    var drag = d3.behavior.drag()
    .on("drag", dragmove)
    .on("dragend", dragended);

    svg.append("line")
        .style("stroke", "red")
        .style("stroke-width", "7px")
        .attr("x1",width)
        .attr("y1",0)
        .attr("x2",width)
        .attr("y2",height)
        .attr("scale",xScale.domain()[1]/width)
        .attr("width",width)
        .attr("col",col)
        .attr("prev",width)
        .call(drag);
    bounds[col] = xScale.domain()[1];

    // draw the x axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
}

function dragmove() {
    var x = Math.max(0, Math.min(this.getAttribute("width"), d3.event.x));
    d3.select(this)
        .attr("x1", x)
        .attr("x2", x);
}

function dragended() {
    var obj = d3.select(this);
    var col = obj.attr("col");
    var x = +obj.attr("x1");   // convert string to float
    var prev = +obj.attr("prev");
    bounds[col] = x*obj.attr("scale");
    if (x < prev) {
        hideMarkers(col);
    } else if (x > prev) {
        showMarkers();
    }
    obj.attr("prev", x);
}

function drawHist(chart,col) {
    var width =  document.getElementById(chart).offsetWidth - margin.left - margin.right;
    var height = document.getElementById(chart).offsetHeight - margin.top - margin.bottom;
    var xScale = d3.scale.linear()
        .domain([0, d3.max(markers, function(d) { return d[col]; })])
        .range([0, width]);
    var yScale = d3.scale.linear()
        .range([height, 0]);
    var binwidth = xScale.domain()[1]/10.;
    var hist = d3.layout.histogram()
        .bins(d3.range(xScale.domain()[0], xScale.domain()[1]+0.5*binwidth, binwidth))
        (markers.map(function(d) {return d[col]; }));
    var xBinwidth = width / hist.length *0.9;
    yScale.domain([0, d3.max(hist, function(d) { return d.y; })]);

    var svg = d3.select('#'+chart+' svg')
    var bar = svg.selectAll(".bar").data(hist);
    bar.exit().remove();
    bar.enter().append("rect")
        .attr("class", "bar");
    bar.attr("height", function(d) { return height- yScale(d.y); })
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

    svg.select("line")
        .attr("x1",width)
        .attr("x2",width);

    d3.select(".x.axis").call(xAxis);

}

function reset(chart) {
    var width =  document.getElementById(chart).offsetWidth - margin.left - margin.right;
    var svg = d3.select('#'+chart+' svg')
    svg.select("line")
        .attr("x1",width)
        .attr("x2",width);
}
