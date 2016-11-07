var w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    x = 1400,
    y = 900;

var margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
    },
    width = (x - margin.right - margin.left - 200),
    height = .8 * (y - margin.top - margin.bottom);
var root;
var names;
var rows;

var format = d3.format("$,.0f");
var galaxy = d3.layout.galaxy()
    .size([width, height])
    .spread(3)
    .value(function(d) {
        return d.size;
    });
var color_hash = [{
    name: 'Project',
    color: '#1F77B4'
}, {
    name: 'Module',
    color: '#2CA02C'
}, {
    name: 'Components',
    color: '#FF7F0E'
}];

function main(file) {

    d3.text(file,
        function(error, txtdata) {
            rows = d3.csv.parseRows(txtdata,
                function(d, i) {
                    if (i == 0) {
                        names = d;
                        return null;
                    } else {
                        d[d.length - 1] = +d[d.length - 1];
                        return d;
                    }
                });

            rows.forEach(function(r, i, a) {
                var rnames = {};
                for (var j = 0; j < r.length - 1; j++) {
                    if (rnames[r[j].toLowerCase()]) {
                        r[j] = '';
                    }
                    rnames[r[j].toLowerCase()] = true;
                }
            });

            root = unflatten(rows, "Service Power");

            var lines = d3.svg.line(); // unused !
            var nodes = galaxy.nodes(root);
            var links = galaxy.links(nodes);

            var link = svg.selectAll(".link")
                .data(links)
                .enter().append("line")
                .attr("class", "link")
                .style("stroke-width", function(d) {
                    return Math.sqrt(d.value);
                })
                .call(truncated_line);

            function truncated_line(l) {
                function len(d) {
                    return Math.sqrt(Math.pow((d.target.y - d.source.y), 2) +
                        Math.pow((d.target.x - d.source.x), 2));
                }
                l.attr('x1', function(d) {
                    return d.source.x +
                        (d.target.x - d.source.x) * d.source.r / len(d);
                });
                l.attr('y1', function(d) {
                    return d.source.y +
                        (d.target.y - d.source.y) * d.source.r / len(d);
                });
                l.attr('x2', function(d) {
                    return d.target.x +
                        (d.source.x - d.target.x) * d.target.r / len(d);
                });
                l.attr('y2', function(d) {
                    return d.target.y +
                        (d.source.y - d.target.y) * d.target.r / len(d);
                });
            }

            var node = svg.datum(root).selectAll(".node")
                .data(nodes)
                .enter().append("g")
                .attr("class", function(d) {
                    if(d.name == 'Service Power'){
                        return 'main-node'
                    }
                    return d.children ? "node" : "leaf node";
                })
                .attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });
            node.append("circle")
                .attr("r", function(d) {
                    switch (d.name) {
                        case 'Service Power':
                            return 93.83149865783702;
                            break;
                        case 'Login':
                            return 55.54039805048281;
                            break;
                        case 'Home':
                            return 55.54039805048281;
                            break;
                        case 'Result':
                            return 55.54039805048281;
                            break;
                        default:
                            return 31
                    }
                });


            node.append("text")
                .attr("dy", ".3em")
                .style("text-anchor", "middle")

                .text(function(d) {
                    return d.name
                });

        });
}

var svg = d3.select(".chart")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var legend = svg.append("g")
    .attr("class", "legend")

for (var i = 0; i < color_hash.length; i++) {
    legend.append("rect")
        .attr("transform", "translate("+(width-10)+"," + 20 * i + ")")
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", function(d) {
            return color_hash[i].color
        });

    legend.append("text")
        .attr("y", 10)
        .attr("transform", "translate("+(width-20)+"," + 20 * i + ")")
        .text(function(d) {
            return color_hash[i].name
        });
}


function unflatten(rows, rootName) {
    var root = {
        name: rootName,
        children: [],
        childmap: {},
        value: 0,
        depth: 0
    };
    var allnodes = [];
    for (var i = 0; i < rows.length; i++) { // rows
        var row = rows[i];
        for (var c = 0, parent = root; c < names.length - 1; c++) { //cols
            var node, label = row[c];
            if (!parent.childmap[label]) {
                node = {
                    name: label,
                    children: [],
                    childmap: {},
                    parent: parent,
                    value: 0,
                    depth: parent.depth + 1
                };
                allnodes.push(node);
                if (!!label) {
                    parent.childmap[label] = node;
                    parent.children.push(node);
                }
            }
            if (c == names.length - 2) { // last column of names
                node.value = row[row.length - 1];
                // add value to all parents value;
                for (var p = parent; p; p = p.parent) {
                    p.value += node.value;
                }
            }
            if (!!label) {
                parent = parent.childmap[label];
            }
        }
    }
    // remove the children of leaf nodes
    allnodes.forEach(function(n, i, a) {
        if (n.children.length === 0) {
            n.size = n.value;
            delete n.children;
        }
    });
    return root;
};