class Histogram{
    constructor(_config, _data, _type) {
        // Configuration object with defaults
        this.config = {
          parentElement: _config.parentElement,
          logRange: _config.logRange || [100, 0],
          containerWidth: _config.containerWidth || 300,
          containerHeight: _config.containerHeight || 200,
          margin: _config.margin || {top: 10, right: 5, bottom: 25, left: 40},
          logScale: _config.logScale || false,
          tooltipPadding: _config.tooltipPadding || 15
        }
        this.data = _data;
        this.type = _type;
        this.initVis();
      }

    initVis(){
        let vis = this;
        var data = this.data;
        // set the dimensions and margins of the graph
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // append the svg object to the body of the page
        vis.chart = d3.select(vis.config.parentElement)
        .attr("width", vis.width + vis.config.margin.left + vis.config.margin.right)
        .attr("height", vis.height + vis.config.margin.top + vis.config.margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + vis.config.margin.left + "," + vis.config.margin.top + ")");

        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`);
        
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');
    }

    updateVis(){
        let vis = this;
        var data = this.data;

         // X axis: scale and draw:
         vis.xScale = d3.scaleLinear()
         .domain([0, d3.max(data, function(d) { return +d.sy_dist })])     //Update tomain in updates
         .range([0, vis.width]);

        // set the parameters for the histogram
        vis.histogram = d3.histogram()
        .value(function(d) { return d.sy_dist; })   // I need to give the vector of value
        .domain(vis.xScale.domain())  // then the domain of the graphic
        .thresholds(vis.xScale.ticks(30)); // then the numbers of bins

        // And apply this function to data to get the bins
        vis.bins = vis.histogram(data);

        // Y axis: scale and draw:
        vis.yScale = d3.scaleLinear()
        .range([vis.height, 0])
        .domain([0, d3.max(vis.bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously

        vis.xAxis = d3.axisBottom(vis.xScale)
            .tickFormat(d3.format('.1s'));
        vis.yAxis = d3.axisLeft(vis.yScale);



        this.renderVis();
    }

    renderVis(){
        let vis = this;
        
        // append the bar rectangles to the svg element
        let rects = vis.chart.selectAll(".rect")
        .data(vis.bins)
        .join("rect");

        rects
        .transition().duration(1000)
            .attr("class", "rect")
            .attr("transform", function(d) { return "translate(" + vis.xScale(d.x0) + "," + vis.yScale(d.length) + ")"; })
            .attr("width", function(d) { return vis.xScale(d.x1) - vis.xScale(d.x0) -1 ; })
            .attr("height", function(d) { return vis.height - vis.yScale(d.length); })
            .style("fill", "#69b3a2");

        rects
            // Show tooltip on hover
            .on('mouseover', (event,d) => {
                d3.select('#tooltip')
                .style('opacity', 1)
                // Format number with million and thousand separator
                .html(`<div class="tooltip-label">${vis.type}<br>${d.x0}-${d.x1}</div>${d3.format(',')(d.length)}`);
                })
            .on("mousemove", (event) => {
                d3.select('#tooltip')
                  .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
                  .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
              })
            .on("mouseleave", () => {
                d3.select('#tooltip').style('opacity', 0);
              })
            .on('click', (event, d) =>{
                console.log(d.x0, d.x1, vis.type);
              });
        
        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);

    }
}