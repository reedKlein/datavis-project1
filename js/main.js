/**
 * Load data from CSV file asynchronously and render bar chart
 */

// Initialize chart and then show it
var sy_snum_barchart;
var charts = [];
// Array to simplify formatting
var noformat_barcharts = ['sy_snum', 'sy_pnum', 'discoverymethod', 'habitability'];
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
      init_table_data.push({name: d.pl_name, distance: d.sy_dist.toString() + " ps", disc_year: d.disc_year.getUTCFullYear()});
    });
    // Format all_data array to compare rest of filtered arrays
    all_data = data;
    selected_filters = [];
    filter_stars(all_data);
    add_habitable();
    
    sy_snum_barchart = new Barchart({ parentElement: '#sy_snum_chart', 
                                    logRange: .5}, 
                                    format_barchart(data, "sy_snum"), 
                                    "sy_snum"); // d3 rollup length of values from sy_snum
    charts.push(sy_snum_barchart);

    sy_pnum_barchart = new Barchart({ parentElement: '#sy_pnum_chart', 
                                    logRange: .5
                                    }, 
                                    format_barchart(data, "sy_pnum"), 
                                    "sy_pnum");
    charts.push(sy_pnum_barchart);

    st_spectype_barchart = new Barchart({ parentElement: '#st_spectype_chart', 
                                    logRange: .5,
                                    containerHeight: 300}, 
                                    format_barchart(data, "st_spectype"), 
                                    "st_spectype");
    charts.push(st_spectype_barchart);

    discoverymethod_barchart = new Barchart({ parentElement: '#discoverymethod_chart', 
                                    logRange: .5,
                                    margin: {top: 10, right: 5, bottom: 100, left: 40},
                                    containerHeight: 300,
                                    containerWidth: 400},
                                    format_barchart(data, "discoverymethod"), 
                                    "discoverymethod");
    charts.push(discoverymethod_barchart);

    habitable_barchart = new Barchart({ parentElement: '#habitable_barchart',
                                        containerHeight:300}, 
                                    format_barchart(data, "habitability"),
                                    "habitability");
    charts.push(habitable_barchart);

    distance_histogram = new Histogram({ parentElement: '#distance_chart'}, 
                                    data, 
                                    "sy_dist");
    charts.push(distance_histogram);

    disc_year_linechart = new FocusContextVis({ parentElement: '#disc_year_chart'}, 
                                    format_barchart(data, "disc_year"), 
                                    "disc_year");
    charts.push(disc_year_linechart);

    radius_mass_scatterplot = new Scatterplot({ parentElement: '#radius_mass_chart'}, 
                                    format_scatterplot(data),
                                    "radius_mass");
    charts.push(radius_mass_scatterplot);

    // create tabulator table
    table = new Tabulator("#data_table", {
        layout: "fitColumns",
        responsiveLayout:true,
        data: init_table_data,
        pagination: "local",
        paginationSize: 15,
        columns:[
            {title:"Name", field:"name", minWidth: 100},
            {title:"Distance from Earth", field:"distance", width: 160},
            {title:"Discovery Year", field:"disc_year", width: 130}
        ]
    })

    // listen for clicks to update modal
    table.on("rowClick", function(e, row){
        tselect_data = row.getData().name;
        populate_info_modal(tselect_data);
        
    })

    // Sort and update charts to initial dataset
    charts.forEach(chart => {
        custom_sort(chart);
        chart.updateVis();
    });

  })
  .catch(error => {
        console.error(error);
  });

// Sort per chart
function custom_sort(chart){
    if(chart.type == "st_spectype"){
        chart.data.sort((a, b) => {
                        if(a.x < b.x){ return -1}
                        if(a.x > b.x){ return 1}
                        return 0;
                    });
    }
    if(chart.type == "discoverymethod"){
        chart.data.sort((a,b) => b.y - a.y);
    }
    chart.data.sort((a,b) => a.x - b.x);
    return;
}

// Add habitability data to all_data array
function add_habitable(){
    all_data.forEach(d => {
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
    return all_data;
}

// Get star data from star string
function filter_stars(data){
    let spectypes = ['A', 'F', 'G', 'K', 'M'];
    data.forEach( d => {
        if(spectypes.includes(d.st_spectype)){
            return;
        }
        d.st_spectype = 'undefined';
    });
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

// Event listeners for styling and functionality
d3.select('#sy_snum_logScale').on('click', d=> {
    let ele = d3.select('#sy_snum_logScale')
    if(ele.classed('selected')){ele.classed('selected', false)}
    else{ele.classed('selected', true)}
    sy_snum_barchart.config.logScale = !sy_snum_barchart.config.logScale;
    sy_snum_barchart.updateVis();
});
d3.select('#sy_pnum_logScale').on('click', d=> {
    let ele = d3.select('#sy_pnum_logScale')
    if(ele.classed('selected')){ele.classed('selected', false)}
    else{ele.classed('selected', true)}
    sy_pnum_barchart.config.logScale = !sy_pnum_barchart.config.logScale;
    sy_pnum_barchart.updateVis();
});
d3.select('#st_spectype_logScale').on('click', d=> {
    let ele = d3.select('#st_spectype_logScale')
    if(ele.classed('selected')){ele.classed('selected', false)}
    else{ele.classed('selected', true)}
    st_spectype_barchart.config.logScale = !st_spectype_barchart.config.logScale;
    st_spectype_barchart.updateVis();
});
d3.select('#discoverymethod_logScale').on('click', d=> {
    let ele = d3.select('#discoverymethod_logScale')
    if(ele.classed('selected')){ele.classed('selected', false)}
    else{ele.classed('selected', true)}
    discoverymethod_barchart.config.logScale = !discoverymethod_barchart.config.logScale;
    discoverymethod_barchart.updateVis();
});
d3.select('#habitable_logScale').on('click', d=> {
    let ele = d3.select('#habitable_logScale')
    if(ele.classed('selected')){ele.classed('selected', false)}
    else{ele.classed('selected', true)}
    habitable_barchart.config.logScale = !habitable_barchart.config.logScale;
    habitable_barchart.updateVis();
});
d3.select('#distance_logScale').on('click', d=> {
    let ele = d3.select('#distance_logScale')
    if(ele.classed('selected')){ele.classed('selected', false)}
    else{ele.classed('selected', true)}
    distance_histogram.config.logScale = !distance_histogram.config.logScale;
    distance_histogram.updateVis();
});
d3.select('#solr_filter').on('click', d=> {
    let ele = d3.select('#solr_filter')
    if(ele.classed('selected')){ele.classed('selected', false)}
    else{ele.classed('selected', true)}
    radius_mass_scatterplot.solr_filter = !radius_mass_scatterplot.solr_filter
    radius_mass_scatterplot.updateVis();
});


// Clear selection button functionality
function clearSelect(){
    selected_filters = [];
    filtering_event(all_data);
}

// update table and charts with filtered data
function filtering_event(filtered_data){
    table.setData(format_tabulator(filtered_data));
    charts.forEach(chart => {
        if(noformat_barcharts.includes(chart.type)){
            chart.data = format_barchart(filtered_data, chart.type);
            custom_sort(chart);
            chart.updateVis();
        }
        if(chart.type == "st_spectype"){
            chart.data = format_barchart(filtered_data, "st_spectype")
            custom_sort(chart);
            chart.updateVis();
        }
        if(chart.type == "sy_dist"){
            chart.data = filtered_data;
            chart.updateVis();
        }
        if(chart.type == "disc_year"){
            chart.data = format_barchart(filtered_data, chart.type);
            custom_sort(chart);
            chart.updateVis();
        }
        if(chart.type == "radius_mass"){
            chart.data = format_scatterplot(filtered_data, chart.type);
            custom_sort(chart);
            chart.updateVis();
        }
    })
}

// handle interaction with filter
function handle_filter(d, field){
    update_selection(d, field);
    filtered_data = all_data;
    selected_filters.forEach( filter => {
        if(noformat_barcharts.includes(filter.field) || filter.field == "st_spectype"){
            filtered_data = filtered_data.filter(x => {return x[filter.field] == filter.d['x']});
        }
    })
    filtering_event(filtered_data);
}

// update selection for multi select
function update_selection(d, field){
    if(selected_filters.length == 0){
        selected_filters.push({"field": field, "d": d});
    }
    else{
        let index = 0
        let newFilter = true;
        selected_filters.forEach( filter =>{
            if(filter.field == field && filter.d['x'] == d['x']){
                selected_filters.splice(index, 1);
                newFilter = false;       
            }
            index++;
        });
        if(newFilter){
            selected_filters.push({"field": field, "d": d});
        }
    }
}

// format data for tabulator intake
function format_tabulator(data){
    let tabulator_data = [];
    data.forEach(d => {
        tabulator_data.push({name: d.pl_name, distance: d.sy_dist.toString() + " ps", disc_year: d.disc_year.getUTCFullYear()});
    });
    return tabulator_data;
}


// Help Modal
var modal = document.getElementById("help_modal");
// Help button
var help = document.getElementById("help");
var close = document.getElementsByClassName("close")[0];
var close2 = document.getElementsByClassName("close")[1];
info_modal = document.getElementById("info_modal");

help.onclick = function(){
    modal.style.display = "block";
}
close.onclick = function(){
    modal.style.display = "none";
    info_modal.style.display = "none";
}
window.onclick = function(event) {
    if(event.target == modal || event.target == info_modal){
        modal.style.display = "none";
        info_modal.style.display = "none";
    }
}
close2.onclick = function(){
    modal.style.display = "none";
    info_modal.style.display = "none";
}

// handle and populate information modal for exoplanets
function populate_info_modal(pl_name){
    let data = all_data.filter(x => {return x.pl_name == pl_name});
    data = clean_return_data(data);
    let planetName = pl_name;
    let planetType = get_planet_type(data[0]);
    let planetRad = data[0].pl_rade + "x Earth";
    let starType = data[0].st_spectype;
    let starRad = data[0].st_rad + "x The Sun";
    let starMass = data[0].st_mass + "x The Sun";
    let habitability = data[0].habitability;

    document.getElementById("RHeader").innerHTML = planetName;
    document.getElementById("i_ptype").innerHTML = planetType;
    document.getElementById("i_prad").innerHTML = planetRad;
    document.getElementById("i_stype").innerHTML = starType;
    document.getElementById("i_srad").innerHTML = starRad;
    document.getElementById("i_smass").innerHTML = starMass;
    document.getElementById("i_habitability").innerHTML = habitability;

    info_modal.style.display = "block";
}

// Planet type calculation
function get_planet_type(data){
    if(data.pl_bmasse >= 50){
        return "Gas Giant - Jovian"
    }
    if(data.pl_bmasse >= 10){
        return "Gas Giant - Neptunian"
    }
    if(data.pl_bmasse >= 2){
        return "Terrestrial - Superterran"
    }
    if(data.pl_bmasse >= .5){
        return "Terrestrial - Terran"
    }
    if(data.pl_bmasse >= .1){
        return "Terrestrial - Subterran"
    }
    if(data.pl_bmasse >= .00001){
        return "Minor Planet - Mercurian"
    }
    if(data.pl_bmasse <= .00001){
        return "Minor Planet - Asteroidan"
    }
    return "N/A"
}

// Clean data before display
function clean_return_data(data){
    if(data.pl_rade == 0 || data.pl_rade == null || data.pl_rade == ""){data.pl_rade = "N/A"}else{data.pl_rade = data.pl_rade + "x The Sun"}
    if(data.st_rad == 0 || data.st_rad == null || data.st_rad == ""){data.st_rad = "N/A"}else{data.st_rad = data.st_rad + "x The Sun"}
    if(data.st_mass == 0 || data.st_mass == null || data.st_mass == ""){data.st_mass = "N/A"}else{data.st_mass = data.st_mass + "x The Sun"}
    return data;
}
