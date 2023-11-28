class Table {

    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: _config.containerWidth || 700,
        containerHeight: _config.containerHeight || 400,
        margin: _config.margin || {top: 10, right: 15, bottom: 30, left: 40},
        tooltipPadding: _config.tooltipPadding || 15
      }
      this.data = _data;
      this.selected = [];
      this.filters = [];
      this.initVis();
    }

    initVis(){
        vis = this;

        vis.table = document.getElementById("data_table");
        let row = table.insertRow()
        let cell;
        let perrow = 2;
        
        vis.data.forEach((value, i) => {
            // (C1) ADD CELL
            cell = row.insertCell();
            cell.innerHTML = value;
           
            // (C2) CLICK ON CELL TO DO SOMETHING
            // cell.onclick = FUNCTION;
           
            // (C3) TO PASS IN A RUNNING NUMBER OR PARAMETER
            // cell.onclick = () => console.log(i);
           
            // (C4) BREAK INTO NEXT ROW
            let next = i + 1;
            if (next%perrow==0 && next!=data.length) { row = table.insertRow(); }
          });
        
    }
}