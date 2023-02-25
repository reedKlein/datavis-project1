/**
 * Load data from CSV file asynchronously and render bar chart
 */
var sy_snum_barchart;
// Initialize chart and then show it
var charts = [];
var noformat_barcharts = ['sy_snum', 'sy_pnum', 'discoverymethod'];
d3.csv('data/exoplanets-1.csv')
  .then(data => {
    var init_table_data = [];
    data.forEach(d => {
      d.sy_snum = +d.sy_snum;
      d.sy_pnum = +d.sy_pnum;
      d.st_spectype = d.st_spectype[0];
      d.pl_rade = +d.pl_rade;
      d.pl_bmasse = +d.pl_bmasse;
      d.pl_orbsmax = +d.pl_orbsmax;
      d.sy_dist = +d.sy_dist;
      d.disc_year = new Date(d.disc_year);
      init_table_data.push({name: d.pl_name, distance: d.sy_dist, size: d.pl_bmasse});
    });
    console.log(data[0]);
    
    sy_snum_barchart = new Barchart({ parentElement: '#sy_snum_chart', 
                                    logRange: [110, 0]}, 
                                    format_barchart(data, "sy_snum"), 
                                    "sy_snum"); // d3 rollup length of values from sy_snum
    charts.push(sy_snum_barchart);

    sy_pnum_barchart = new Barchart({ parentElement: '#sy_pnum_chart', 
                                    logRange: [130, 0]}, 
                                    format_barchart(data, "sy_pnum"), 
                                    "sy_pnum");
    charts.push(sy_pnum_barchart);

    st_spectype_barchart = new Barchart({ parentElement: '#st_spectype_chart', 
                                    logRange: [130, 0]}, 
                                    format_barchart(filter_stars(data), "st_spectype"), 
                                    "st_spectype");
    charts.push(st_spectype_barchart);

    discoverymethod_barchart = new Barchart({ parentElement: '#discoverymethod_chart', 
                                    logRange: [120, 0],
                                    margin: {top: 10, right: 5, bottom: 100, left: 90},
                                    containerHeight: 300},
                                    format_barchart(data, "discoverymethod"), 
                                    "discoverymethod");
    charts.push(discoverymethod_barchart);

    habitable_barchart = new Multi_Barchart({ parentElement: '#habitable_chart', 
                                    logRange: [130, 0]}, 
                                    habitability_format(data),
                                    "x",
                                    "y",
                                    ['uninhabitable', 'habitable', 'undefined'],
                                    "habitability");
    charts.push(habitable_barchart);

    distance_histogram = new Histogram({ parentElement: '#distance_chart'}, 
                                    data, 
                                    "distance");
    charts.push(distance_histogram);

    disc_year_linechart = new FocusContextVis({ parentElement: '#discovery_year_chart'}, 
                                    format_barchart(data, "disc_year"), 
                                    "discovery_year");
    charts.push(disc_year_linechart);

    radius_mass_scatterplot = new Scatterplot({ parentElement: '#radius_mass_chart'}, 
                                    format_scatterplot(data),
                                    "radius_mass");
    charts.push(radius_mass_scatterplot);

    table = new Tabulator("#data_table", {
        layout: "fitColumns",
        responsiveLayout:true,
        data: init_table_data,
        pagination: "local",
        paginationSize: 15,
        columns:[
            {title:"Name", field:"name"},
            {title:"Distance from Earth", field:"distance"},
            {title:"Size", field:"size"},
            {title:"View More", field:"more"}
        ]
    })


    console.log("charts:", charts);

    charts.forEach(chart => {
        custom_sort(chart);
    });

    sy_snum_barchart.updateVis();
    sy_pnum_barchart.updateVis();
    st_spectype_barchart.updateVis();
    discoverymethod_barchart.updateVis();
    habitable_barchart.updateVis();
    distance_histogram.updateVis();
    disc_year_linechart.updateVis();
    radius_mass_scatterplot.updateVis();

    all_data = data;
  })
  .catch(error => {
        console.error(error);
  });

function custom_sort(chart){
    if(chart.type == "st_spectype" || chart.type == "discoverymethod"){
        chart.data.sort((a, b) => {
                        if(a.x < b.x){ return -1}
                        if(a.x > b.x){ return 1}
                        return 0;
                    });
    }
    chart.data.sort((a,b) => a.x - b.x);
    return;
}

function habitability_format(data){
    filteredData = filter_stars(data);
    filteredData.forEach(d => {
        d.habitability = "uninhabitable";
        if(d.st_spectype == "A" && d.pl_orbsmax >= 8.5 && d.pl_orbsmax <= 12.5 ||
        d.st_spectype == "F" && d.pl_orbsmax >= 1.5 && d.pl_orbsmax <= 2.2 ||
        d.st_spectype == "G" && d.pl_orbsmax >= .95 && d.pl_orbsmax <= 1.4 ||
        d.st_spectype == "K" && d.pl_orbsmax >= .38 && d.pl_orbsmax <= .56 ||
        d.st_spectype == "M" && d.pl_orbsmax >= .08 && d.pl_orbsmax <= .12){
            d.habitability = "habitable";
        }
        else if(d.st_spectype == "undefined" || !d.pl_orbsmax){
            d.habitability = "undefined";
        }
    });
    filteredDataGroups = d3.group(filteredData, d => d.st_spectype);
    filteredDataGroups = Object.assign(Array.from(filteredDataGroups).map(([k, v]) => ({"group": k, "arr": v})));
    definedData = filteredDataGroups.filter((d) => {return d.group != 'undefined'});
    undefinedData = filteredDataGroups.filter((d) => {return d.group == 'undefined'});
    dataObjects = [];
    definedData.forEach(d =>{
        dataObjects.push({
            "uninhabitable": d.arr.filter((o) => {return o.habitability == 'uninhabitable'}).length,
            "habitable": d.arr.filter((o) => {return o.habitability == 'habitable'}).length,
            "undefined": d.arr.filter((o) => {return o.habitability == 'undefined'}).length,
            "group": d.group
        });
    })
    dataObjects.push({"undefined": undefinedData[0].arr.length, 
                      "uninhabitable": 0,
                      "habitable": 0,
                      "group": "unknown"});


    return dataObjects;
}

function filter_stars(data){
    let spectypes = ['A', 'F', 'G', 'K', 'M'];
    data.forEach( d => {
        if(spectypes.includes(d.st_spectype)){
            return;
        }
        d.st_spectype = 'undefined';
    });
    return data;
}

// Create an object from rolled up data and assign it to templated "x" and "y" fields
function format_barchart(data, field){
    data_rollup = d3.rollup(data, v => v.length, d => d[field])
    let myObjStruct = Object.assign(Array.from(data_rollup).map(([k, v]) => ({"x": k, "y" : v})));
    return myObjStruct;
}

function format_scatterplot(data){
    let objArr = [];
    data.forEach( d => {
        objArr.push({"name": d.pl_name, "x": d.pl_rade, "y": d.pl_bmasse});
    });
    return objArr;
}

// Bar Charts Buttons
d3.select('#sy_snum_sorting').on('click', d => {
    sy_snum_barchart.data.reverse();
    sy_snum_barchart.updateVis();
})
d3.select('#sy_pnum_sorting').on('click', d => {
    sy_pnum_barchart.data.reverse();
    sy_pnum_barchart.updateVis();
})
d3.select('#st_spectype_sorting').on('click', d => {
    st_spectype_barchart.data.reverse();
    st_spectype_barchart.updateVis();
})
d3.select('#discoverymethod_sorting').on('click', d => {
    discoverymethod_barchart.data.reverse();
    discoverymethod_barchart.updateVis();
})
d3.select('#habitable_sorting').on('click', d => {
    habitable_barchart.data.reverse();
    habitable_barchart.updateVis();
})

// logscale

d3.select('#sy_snum_logScale').on('click', d=> {
    sy_snum_barchart.config.logScale = !sy_snum_barchart.config.logScale;
    sy_snum_barchart.updateVis();
})
d3.select('#sy_pnum_logScale').on('click', d=> {
    sy_pnum_barchart.config.logScale = !sy_pnum_barchart.config.logScale;
    sy_pnum_barchart.updateVis();
})
d3.select('#st_spectype_logScale').on('click', d=> {
    st_spectype_barchart.config.logScale = !st_spectype_barchart.config.logScale;
    st_spectype_barchart.updateVis();
})
d3.select('#discoverymethod_logScale').on('click', d=> {
    discoverymethod_barchart.config.logScale = !discoverymethod_barchart.config.logScale;
    discoverymethod_barchart.updateVis();
})
d3.select('#habitable_logScale').on('click', d=> {
    habitable_barchart.config.logScale = !habitable_barchart.config.logScale;
    habitable_barchart.updateVis();
})


function filtering_event(d, field){
    console.log(d, field);
    let filtered_data = handle_filter(d, field);
    table.setData(all_data.filter(x => {return x[field] == d['x']}));
    charts.forEach(chart => {
        if(noformat_barcharts.includes(chart.type)){
            chart.data = format_barchart(handle_filter(d, field), chart.type);
            custom_sort(chart);
            chart.updateVis();
        }
        if(chart.type == "st_spectype"){
            chart.data = format_barchart(filter_stars(handle_filter(d, field)), "st_spectype")
            custom_sort(chart);
            chart.updateVis();
        }
        if(chart.type == "distance"){
            chart.data = handle_filter(d, field);
            chart.updateVis();
        }
        if(chart.type == "habitability"){
            chart.data = habitability_format(handle_filter(d, field))
            custom_sort(chart);
            chart.updateVis();
        }
    })
}

function handle_filter(d, field){
    if(noformat_barcharts.includes(field) || field == "st_spectype"){
        return all_data.filter(x => {return x[field] == d['x']});
    }
    return;
}

/* TODO

5. Table
5a. updating table
7. Padding for discoverymethod ticks
8. Log scale updates (or zoom)
9. Fix visuals
9a. new Date() for discovery year
10c. sorting
12. Decoration 
12a. theme colors
12b. scatterplot color pallette
12c. responsive
10. More information
11. Brushing
~ 3 days work
*/