var width = 960,
height = 1160,
centered;

var sexRatioByProvince = d3.map();

var svg = d3.select("#map")
              .append("svg")
                .attr("width", width)
                .attr("height", height);

var years = [1999, 2009];
var currentYear = 2009;

var bucketOptions = [
  { label: 'Normal', color: '#fee8c8', visibility: true },
  { label: 'High', color: '#fdbb84', visibility: true },
  { label: 'Very High', color: '#e34a33', visibility: true }
];
var buckets = [[],[],[]];

queue()
  .defer(d3.json,"vietnam_adm2.json")
  .defer(d3.csv,
          "data/sex_ratio_at_birth_by_province.csv",
          function(d){
            sexRatioByProvince.set(d.id, { 1999: d['1999'], 2009: d['2009'] });
          }
        )
  .await(initializeViz);

function colorBucket(d) {
  var ratios = sexRatioByProvince.get(d.id);
  if (ratios) {
    var bucket = +ratios[currentYear];
    if (!isNaN(bucket)) {
      if (bucketOptions[bucket].visibility) {
        return bucketOptions[bucket].color;
      }
    }
  }

  return '#ccc';
}

function updateAll() {
  updateBuckets();
  updateMap();
}

function updateMap() {
  svg.selectAll("path")
      .attr("fill", colorBucket);
}

function updateBuckets() {
  resetBuckets();

  svg.selectAll("path")
        .each(function(d){
          var ratios = sexRatioByProvince.get(d.id);
          if (ratios) {
            var bucket = +ratios[currentYear];
            if (!isNaN(bucket)) {
              buckets[bucket].push(d.id);
            }
          }
        });

  for (var i=0; i <= 2; i++) {
    var div = d3.select('.bucket-'+i);
    div.select('.filter')
        .property('checked', bucketOptions[i].visibility);
    div.select('.size')
        .text('('+buckets[i].length+')');
    listProvinces(i);
  }
}

function listProvinces(bucket) {
  var ul = d3.select('.provinces-' + bucket).html('');
  var lis = ul.selectAll('li').data(buckets[bucket]);
  lis.enter()
      .append('li')
      .text(function(d) { return d; });
  lis.exit()
      .remove();
}

function initializeViz(error, topojsonFile, data) {
  initializeControls();
  initializeMap(topojsonFile);
  updateAll();
}

function initializeMap(topojsonFile) {
  svg.append("rect")
    .attr("fill", "#eee")
    .attr("width", width)
    .attr("height", height);

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
}

function updateYear(year) {
  currentYear = year;
  resetBucketVisibility();
  updateAll();
}

function toggleBucket(bucket, visibility) {
  bucketOptions[bucket].visibility = visibility;
  updateMap();
}

function resetBuckets() {
  buckets = [[],[],[]];
  return buckets;
}

function resetBucketVisibility() {
  for (var i=0; i<=2; i++) {
    bucketOptions[i].visibility = true;
  }
}

function initializeControls() {
  var controls = d3.select('#map')
                      .append('div')
                        .attr('id', 'controls');
  initializeYearFilters(controls);
  initializeBucketFilters(controls);
}

function initializeYearFilters(controls) {
  var div = controls.append('div');
  for (var i=0; i<years.length; i++) {
    div.append('input')
          .attr('type', 'radio')
          .attr('name', 'year')
          .classed('filter-year', true)
          .attr('value', years[i])
          .property('checked', years[i] == currentYear)
          .on('change', function() {
            var year = d3.select(this).attr('value');
            updateYear(year);
            return false;
          });
    div.append('label')
          .text(years[i]);
  }
}

function initializeBucketFilters(controls) {
  var bucketFilters = controls.append('ul');
  for (var i=0; i <= 2; i++) {
    var label = bucketOptions[i].label;
    var color = bucketOptions[i].color;

    var li = bucketFilters.append('li');
    var div = li.append('div')
                  .classed('bucket-'+i, true);
    div.append('input')
          .attr('type', 'checkbox')
          .attr('data-bucket', i)
          .classed('filter', true)
          .property('checked', bucketOptions[i].visibility)
          .on('change', function() {
            var bucket = parseInt(d3.select(this).attr('data-bucket'));
            var visibility = d3.select(this).property('checked');
            toggleBucket(bucket, visibility);
            return false;
          });
    div.append('span')
          .classed('square', true)
          .style('background-color', color);
    div.append('label')
          .text(label);
    div.append('span')
          .classed('size', true)
          .text('(' + buckets[i].length + ')');

    li.append('ul')
        .classed('provinces-' + i, true);
  }
}

