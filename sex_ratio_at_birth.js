var width = 960,
height = 1160,
centered;

var sexRatioByProvince = d3.map();
var svg = d3.select("#map")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

var currentYear = 1999;

queue()
  .defer(d3.json,"vietnam_adm2.json")
  .defer(d3.csv,
          "data/sex_ratio_at_birth_by_province.csv",
          function(d){
            sexRatioByProvince.set(d.id, { 1999: d['1999'], 2009: d['2009'] });
          }
        )
  .await(ready);

function ready(error, topojsonFile, data) {
  svg.append("rect")
    .attr("fill", "#eee")
    .attr("width", width)
    .attr("height", height);

  drawMap(topojsonFile);
  initializeControls();
}

function colorBucket(id) {
  var buckets = sexRatioByProvince.get(id);
  if (!buckets) return '#ccc';

  var bucket = parseInt(buckets[currentYear]);

  switch (bucket) {
    case 0:
      return '#fee8c8';
    case 1:
      return '#fdbb84';
    case 2:
      return '#e34a33';
    default:
      return '#ccc';
  }
}

function updateMap() {
  svg.selectAll("path")
      .attr("fill", function(d) { return colorBucket(d.id); });
}

function drawMap(topojsonFile) {
  var projection = d3.geo.mercator()
                      .center([107,11])
                      .scale(2490)
                      .translate([width/2,height/2]);

  var path = d3.geo.path().projection(projection);

  var provinces = topojson.feature(topojsonFile, topojsonFile.objects.VNM_adm2).features;

  var g = svg.append("g");

  g.append("g")
    .selectAll("path")
    .data(provinces)
    .enter()
      .append("path")
      .attr("id",function(d) { return d.id; })
      .attr("d",path)
      .append("title")
      .text(function(d) { return d.id; });
  updateMap();
}

function update(year) {
  currentYear = year;
  updateMap();
}

function initializeControls() {
  var controls = d3.select('#controls');
  controls.append('a')
          .attr('href', '#')
          .text('1999')
          .on('click', function() { update(1999); return false; });
  controls.append('br');
  controls.append('a')
          .attr('href', '#')
          .text('2009')
          .on('click', function() { update(2009); return false; });
}

