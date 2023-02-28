class Scatterplot {

    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data, _type) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: _config.containerWidth || 500,
        containerHeight: _config.containerHeight || 200,
        margin: _config.margin || {top: 10, right: 15, bottom: 30, left: 40},
        tooltipPadding: _config.tooltipPadding || 15
      }
      this.colorDict = {"Mercury": "#bebfc5", "Venus": "#fffacd", 
                        "Earth": "#1b527c", "Mars": "#903e2d",
                        "Jupiter":"#e0ab76", "Saturn": "#b4a725",
                        "Uranus": "#9eb9d4", "Neptune": "00416a"}
      this.solr_filter = false;
      this.data = _data;
      this.type = _type;
      this.solar_system_planets = this._create_solar_system();
      this.initVis();
    }
    
    /**
     * We initialize scales/axes and append static elements, such as axis titles.
     */
    initVis() {
      let vis = this;
      var data = this.data;
  
      // Calculate inner chart size. Margin specifies the space around the actual chart.
      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
  
      // Initialize scales
    //   vis.colorScale = d3.scaleOrdinal()
    //       .range(['#d3eecd', '#7bc77e', '#2a8d46']) // light green to dark green
    //       .domain(['Easy','Intermediate','Difficult']);
  
      vis.xScale = d3.scaleLog()
          .range([0, vis.width])
  
      vis.yScale = d3.scaleLog()
          .range([vis.height, 0]);

  
      // Define size of SVG drawing area
      vis.svg = d3.select(vis.config.parentElement)
          .attr('width', vis.config.containerWidth)
          .attr('height', vis.config.containerHeight);
  
      // Append group element that will contain our actual chart 
      // and position it according to the given margin config
      vis.chart = vis.svg.append('g')
          .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
  
      // Append empty x-axis group and move it to the bottom of the chart
      vis.xAxisG = vis.chart.append('g')
          .attr('class', 'axis x-axis')
          .attr('transform', `translate(0,${vis.height})`);
      
      // Append y-axis group
      vis.yAxisG = vis.chart.append('g')
          .attr('class', 'axis y-axis');
  
      // Append both axis titles
      vis.chart.append('text')
          .attr('class', 'axis-title')
          .attr('y', vis.height - 15)
          .attr('x', vis.width + 10)
          .attr('dy', '.71em')
          .style('text-anchor', 'end')
          .text('Radius');
  
      vis.svg.append('text')     
          .attr('class', 'axis-title')
          .attr('x', 0)
          .attr('y', 0)
          .attr('dy', '.71em')
          .text('Mass');
    }
  
    /**
     * Prepare the data and scales before we render it.
     */
    updateVis() {
      let vis = this;
      
      // Specificy accessor functions
    //   vis.colorValue = d => d.difficulty;
    
      vis.xValue = d => d.x;
      vis.yValue = d => d.y;

      // Set the scale input domains
      vis.xScale.domain([.3, d3.max(vis.data, vis.xValue)]);
      vis.yScale.domain([.1e-1, d3.max(vis.data, vis.yValue)]);
  
      // Initialize axes
      vis.xAxis = d3.axisBottom(vis.xScale)
          .tickPadding(10)
          .ticks(.01 * vis.config.containerWidth + 1);

        vis.yAxis = d3.axisLeft(vis.yScale)
          .tickPadding(10)
          .ticks(.02 * vis.config.containerHeight + 1);
  
      vis.renderVis();
    }
  
    /**
     * Bind data to visual elements.
     */
    renderVis() {
      let vis = this;

      vis.colorScale = (d) => {
        if(vis.colorDict[d]){
            return vis.colorDict[d];
        }
        return "#3e6464";
      }

      vis.solrFilter = (d) => {
        if(vis.colorDict[d]){
            return false;
        }
        return true;
      }

      vis.solrScale = (d) => {
        if(vis.colorDict[d]){
            return 6;
        }
        return 4;
      }
  
      // Add circles
      vis.solar_system_planets.forEach(p => vis.data.push(p));
      if(vis.solr_filter){
        vis.data = vis.data.filter(x => {return vis.solrFilter(x.name)});
      }
      let circles = vis.chart.selectAll('.point')
          .data(vis.data)
        .join('circle')
          .style('cursor', 'pointer')
          .attr('class', 'point')
          .attr('r', d => vis.solrScale(d.name))
          .attr('cy', d => {if(vis.yValue(d) < vis.yScale.domain()[0] || !vis.yValue(d)){return vis.yScale(vis.yScale.domain()[0]);} return vis.yScale(vis.yValue(d));})
          .attr('cx', d => {if(vis.xScale(vis.xValue(d)) < vis.xScale.domain()[0] || !vis.xValue(d)){return vis.xScale.domain()[0];} return vis.xScale(vis.xValue(d));})
          .attr('fill', d => vis.colorScale(d.name));
          

      circles
          .on('mouseover', (event,d) => {
            d3.select('#tooltip')
              .style('opacity', 1)
              .html(`
                <div class="tooltip-title">${d.name}</div>
                <ul>
                  <li>Radius: ${d.x}x</li>
                  <li>Mass ${d.y}x</li>
                </ul>
              `);
          })
          .on("mousemove", (event) => {
            d3.select('#tooltip')
              .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
              .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
          })
          .on('mouseleave', () => {
            d3.select('#tooltip').style('opacity', 0);
          })
          .on('click', (event, d) =>{
            if(vis.solrFilter(d.name)){
                populate_info_modal(d.name);
            }
          });
      
      // Update the axes/gridlines
      // We use the second .call() to remove the axis and just show gridlines
      vis.xAxisG
          .call(vis.xAxis)
          .call(g => g.select('.domain').remove());
  
      vis.yAxisG
          .call(vis.yAxis)
          .call(g => g.select('.domain').remove())
    }

    _create_solar_system(){
      let objArr = []
      objArr.push({"name": "Mercury", "x": .383, "y": .0553});
      objArr.push({"name": "Venus", "x": .95, "y": .815});
      objArr.push({"name": "Earth", "x": 1, "y": 1});
      objArr.push({"name": "Mars", "x": .532, "y": .107});
      objArr.push({"name": "Jupiter", "x": 11, "y": 318});
      objArr.push({"name": "Saturn", "x": 9.1, "y": 95.2});
      objArr.push({"name": "Uranus", "x": 4, "y": 14.5});
      objArr.push({"name": "Neptune", "x": 3.9, "y": 17.1});
      return objArr;
    }
  }