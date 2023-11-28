/**
 * Load data from CSV file asynchronously and render bar chart
 */

// Initialize chart and then show it
let charts = [];
// Array to simplify formatting
const no_format_barcharts = ['system_star_number', 'system_planet_number', 'discoverymethod', 'habitability'];
let all_data, planet_table;
d3.csv('data/exoplanets-1.csv')
  .then(data => {
    let init_table_data = [];
    data.forEach(d => {
      d.system_star_number = +d.sy_snum;
      d.system_planet_number = +d.sy_pnum;
      d.star_spectype = d.st_spectype[0];
      d.planet_radius = +d.pl_rade;
      d.planet_mass = +d.pl_bmasse;
      d.planet_orbit = +d.pl_orbsmax;
      d.system_distance_from_earth = +d.sy_dist;
      d.discovery_year = new Date(d.disc_year);
      d.planet_name = d.pl_name;
      init_table_data.push({name: d.planet_name, distance: d.system_distance_from_earth.toString() + " ps", discovery_year: d.discovery_year.getUTCFullYear()});
    });
    // Format all_data array to compare rest of filtered arrays
    all_data = data;
    selected_filters = [];
    filterStars(all_data);
    addHabitable();
    
    const system_star_number_barchart = new Barchart({ parentElement: '#system_star_number_chart', 
                                    logRange: .5}, 
                                    formatBarchart(data, "system_star_number"), 
                                    "system_star_number"); // d3 rollup length of values from system_star_number
    charts.push(system_star_number_barchart);

    const system_planet_number_barchart = new Barchart({ parentElement: '#system_planet_number_chart', 
                                    logRange: .5
                                    }, 
                                    formatBarchart(data, "system_planet_number"), 
                                    "system_planet_number");
    charts.push(system_planet_number_barchart);

    const star_spectype_barchart = new Barchart({ parentElement: '#star_spectype_chart', 
                                    logRange: .5,
                                    containerHeight: 300}, 
                                    formatBarchart(data, "star_spectype"), 
                                    "star_spectype");
    charts.push(star_spectype_barchart);

    const discoverymethod_barchart = new Barchart({ parentElement: '#discoverymethod_chart', 
                                    logRange: .5,
                                    margin: {top: 10, right: 5, bottom: 100, left: 40},
                                    containerHeight: 300,
                                    containerWidth: 400},
                                    formatBarchart(data, "discoverymethod"), 
                                    "discoverymethod");
    charts.push(discoverymethod_barchart);

    const habitable_barchart = new Barchart({ parentElement: '#habitable_barchart',
                                        containerHeight:300}, 
                                    formatBarchart(data, "habitability"),
                                    "habitability");
    charts.push(habitable_barchart);

    const distance_histogram = new Histogram({ parentElement: '#distance_chart'}, 
                                    data, 
                                    "system_distance_from_earth");
    charts.push(distance_histogram);

    const discovery_year_linechart = new FocusContextVis({ parentElement: '#discovery_year_chart'}, 
                                    formatBarchart(data, "discovery_year"), 
                                    "discovery_year");
    charts.push(discovery_year_linechart);

    const radius_mass_scatterplot = new Scatterplot({ parentElement: '#radius_mass_chart'}, 
                                    formatScatterplot(data),
                                    "radius_mass");
    charts.push(radius_mass_scatterplot);

    // create tabulator table
    planet_table = new Tabulator("#data_table", {
        layout: "fitColumns",
        responsiveLayout: true,
        data: init_table_data,
        pagination: "local",
        paginationSize: 15,
        columns:[
            {title:"Name", field:"name", width: 100},
            {title:"Distance from Earth", field:"distance", width: 160},
            {title:"Discovery Year", field:"discovery_year", width: 130}
        ]
    })

    // listen for clicks to update modal
    planet_table.on("rowClick", function(e, row){
        tselect_data = row.getData().name;
        populateInfoModal(tselect_data);
        
    })

    // Sort and update charts to initial dataset
    charts.forEach(chart => {
        customSort(chart);
        chart.updateVis();
    });

  })
  .catch(error => {
        console.error(error);
  });

// Sort per chart
function customSort(chart){
    if(chart.type == "star_spectype"){
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
function addHabitable(){
    all_data.forEach(d => {
        d.habitability = "uninhabitable";
        if(d.star_spectype == "A" && d.planet_orbit >= 8.5 && d.planet_orbit <= 12.5 ||
        d.star_spectype == "F" && d.planet_orbit >= 1.5 && d.planet_orbit <= 2.2 ||
        d.star_spectype == "G" && d.planet_orbit >= .95 && d.planet_orbit <= 1.4 ||
        d.star_spectype == "K" && d.planet_orbit >= .38 && d.planet_orbit <= .56 ||
        d.star_spectype == "M" && d.planet_orbit >= .08 && d.planet_orbit <= .12){
            d.habitability = "habitable";
        }
        else if(d.star_spectype == "undefined" || !d.planet_orbit){
            d.habitability = "undefined";
        }
    });
    return all_data;
}

// Get star data from star string
function filterStars(data){
    let spectypes = ['A', 'F', 'G', 'K', 'M'];
    data.forEach( d => {
        if(spectypes.includes(d.star_spectype)){
            return;
        }
        d.star_spectype = 'undefined';
    });
}

// Create an object from rolled up data and assign it to templated "x" and "y" fields
function formatBarchart(data, field){
    data_rollup = d3.rollup(data, v => v.length, d => d[field])
    let myObjStruct = Object.assign(Array.from(data_rollup).map(([k, v]) => ({"x": k, "y" : v})));
    return myObjStruct;
}

function formatScatterplot(data){
    let objArr = [];
    data.forEach( d => {
        objArr.push({"name": d.planet_name, "x": d.planet_radius, "y": d.planet_mass});
    });
    return objArr;
}

// Event listeners for styling and functionality
d3.select('#system_star_number_logScale').on('click', d=> {
    let ele = d3.select('#system_star_number_logScale')
    if(ele.classed('selected')){ele.classed('selected', false)}
    else{ele.classed('selected', true)}
    system_star_number_barchart.config.logScale = !system_star_number_barchart.config.logScale;
    system_star_number_barchart.updateVis();
});
d3.select('#system_planet_number_logScale').on('click', d=> {
    let ele = d3.select('#system_planet_number_logScale')
    if(ele.classed('selected')){ele.classed('selected', false)}
    else{ele.classed('selected', true)}
    system_planet_number_barchart.config.logScale = !system_planet_number_barchart.config.logScale;
    system_planet_number_barchart.updateVis();
});
d3.select('#star_spectype_logScale').on('click', d=> {
    let ele = d3.select('#star_spectype_logScale')
    if(ele.classed('selected')){ele.classed('selected', false)}
    else{ele.classed('selected', true)}
    star_spectype_barchart.config.logScale = !star_spectype_barchart.config.logScale;
    star_spectype_barchart.updateVis();
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
    filteringEvent(all_data);
}

// update table and charts with filtered data
function filteringEvent(filtered_data){
    planet_table.setData(formatTabulator(filtered_data));
    charts.forEach(chart => {
        if(no_format_barcharts.includes(chart.type)){
            chart.data = formatBarchart(filtered_data, chart.type);
            customSort(chart);
            chart.updateVis();
        }
        if(chart.type == "star_spectype"){
            chart.data = formatBarchart(filtered_data, chart.type)
            customSort(chart);
            chart.updateVis();
        }
        if(chart.type == "system_distance_from_earth"){
            chart.data = filtered_data;
            chart.updateVis();
        }
        if(chart.type == "discovery_year"){
            chart.data = formatBarchart(filtered_data, chart.type);
            customSort(chart);
            chart.updateVis();
        }
        if(chart.type == "radius_mass"){
            chart.data = formatScatterplot(filtered_data, chart.type);
            customSort(chart);
            chart.updateVis();
        }
    })
}

// handle interaction with filter
function handleFilter(d, field){
    updateSelection(d, field);
    filtered_data = all_data;
    selected_filters.forEach( filter => {
        if(no_format_barcharts.includes(filter.field) || filter.field == "star_spectype"){
            filtered_data = filtered_data.filter(x => {return x[filter.field] == filter.d['x']});
        }
    })
    filteringEvent(filtered_data);
}

// update selection for multi select
function updateSelection(d, field){ //push filter
    if(selected_filters.length == 0){
        selected_filters.push({"field": field, "d": d});
    }
    else{ // remove filter
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
function formatTabulator(data){
    let tabulator_data = [];
    data.forEach(d => {
        tabulator_data.push({name: d.planet_name, distance: d.system_distance_from_earth.toString() + " ps", discovery_year: d.discovery_year.getUTCFullYear()});
    });
    return tabulator_data;
}


// Help Modal
const modal = document.getElementById("help_modal");
// Help button
const help = document.getElementById("help");
const close = document.getElementsByClassName("close")[0];
const close2 = document.getElementsByClassName("close")[1];
const info_modal = document.getElementById("info_modal");

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
function populateInfoModal(planet_name){
    let data = all_data.filter(x => {return x.planet_name == planet_name});
    data = cleanReturnData(data);
    let planet_type = getPlanetType(data[0]);
    let planet_radius = data[0].planet_radius;
    let star_type = data[0].star_spectype;
    let star_radius = data[0].st_rad;
    let star_mass = data[0].st_mass;
    let habitability = data[0].habitability;

    document.getElementById("RHeader").innerHTML = planet_name;
    document.getElementById("i_ptype").innerHTML = planet_type;
    document.getElementById("i_prad").innerHTML = planet_radius;
    document.getElementById("i_stype").innerHTML = star_type;
    document.getElementById("i_srad").innerHTML = star_radius;
    document.getElementById("i_smass").innerHTML = star_mass;
    document.getElementById("i_habitability").innerHTML = habitability;

    info_modal.style.display = "block";
}

// Planet type calculation
function getPlanetType(data){
    if(data.planet_mass >= 50){
        return "Gas Giant - Jovian"
    }
    if(data.planet_mass >= 10){
        return "Gas Giant - Neptunian"
    }
    if(data.planet_mass >= 2){
        return "Terrestrial - Superterran"
    }
    if(data.planet_mass >= .5){
        return "Terrestrial - Terran"
    }
    if(data.planet_mass >= .1){
        return "Terrestrial - Subterran"
    }
    if(data.planet_mass >= .00001){
        return "Minor Planet - Mercurian"
    }
    if(data.planet_mass <= .00001 && data.planet_mass > 0){
        return "Minor Planet - Asteroidan"
    }
    return "N/A"
}

// Clean data before display
function cleanReturnData(data){
    if(data[0].planet_radius == 0 || data[0].planet_radius == null || data[0].planet_radius == ""){data[0].planet_radius = "N/A"}else{data[0].planet_radius = data[0].planet_radius + "x The Earth"}
    if(data[0].st_rad == 0 || data[0].st_rad == null || data[0].st_rad == ""){data[0].st_rad = "N/A"}else{data[0].st_rad = data[0].st_rad + "x The Sun"}
    if(data[0].st_mass == 0 || data[0].st_mass == null || data[0].st_mass == ""){data[0].st_mass = "N/A"}else{data[0].st_mass = data[0].st_mass + "x The Sun"}
    return data;
}

/*
1. Update variable names
2. Create necessary objects
  a. Create new classes for unclassed objects (e.g. modals/table(essentially a data class))
  b. Bundle appropriate functions on per-class basis and call the generalized name with "this" keyword
3. General code cleanup
4. Update color theme
*/
