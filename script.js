var lastTarget = null;

var shows = {};

var graph = null;
var currentYear = null;
var currentShow = null;

const MONTH_LABELS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const csvStringToArray = (strData) => {
    const objPattern = new RegExp(("(\\,|\\r?\\n|\\r|^)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\\,\\r\\n]*))"), "gi");
    let arrMatches = null, arrData = [[]];
    while (arrMatches = objPattern.exec(strData)) {
        if (arrMatches[1].length && arrMatches[1] !== ",") arrData.push([]);
        arrData[arrData.length - 1].push(arrMatches[2] ?
            arrMatches[2].replace(new RegExp("\"\"", "g"), "\"") :
            arrMatches[3]);
    }
    return arrData;
}

function processData(data) {
    shows = {};
    for (var i = data.length - 1; i > 1; i--) {
        if (data[i].length == 2) {
            var name = data[i][0].split(": ")[0];
            var month = data[i][1].split("/")[0];
            var day = data[i][1].split("/")[1];
            var year = data[i][1].split("/")[2];

            if (shows[year]) {
                if (shows[year][month]) {
                    if (shows[year][month][day]) {
                        if (shows[year][month][day][name]) {
                            shows[year][month][day][name]++;
                        } else {
                            shows[year][month][day] = { ...shows[year][month][day], [name]: 1 };
                        }
                    } else {
                        shows[year][month] = { ...shows[year][month], [day]: { [name]: 1 } };
                    }
                } else {
                    shows[year] = { ...shows[year], [month]: { [day]: { [name]: 1 } } };
                }
            } else {
                shows = { ...shows, [year]: { [month]: { [day]: { [name]: 1 } } } };
            }
        }
    }

    // Create list of shows on left
    var showsList = document.getElementById('shows_list');
    showsList.innerHTML = "";
    // Year headers
    Array.from(Object.keys(shows)).forEach(year => {
        showsList.innerHTML += '<div id=\'' + year + '_area\'><a href="javascript:graphYear(' + year + ')"><h2>20' + year + '</h2></a></div>';
        // Individual shows
        var showCounts = {};
        Object.keys(shows[year]).forEach(month => {
            Object.keys(shows[year][month]).forEach(day => {
                Object.keys(shows[year][month][day]).forEach(show => {
                    if (showCounts[show])
                        showCounts[show] += shows[year][month][day][show];
                    else
                        showCounts = { ...showCounts, [show]: shows[year][month][day][show] };
                });
            });
        });
        var yearArea = document.getElementById(year + '_area');
        Object.keys(showCounts).forEach(show => {
            yearArea.innerHTML += '<a href="javascript:graphShowYear(' + year + ',\`' + show + '\`)">' + show + ': ' + showCounts[show] + '</a><br/>';
        })
    })
}

// change 'Total Views: ' number
function setTotalViews(graphData) {
    var views = 0;
    graphData.forEach(column => {
        views += parseInt(column);
    });
    var viewsSection = document.getElementById("total_views");
    viewsSection.innerHTML = 'Total Views: ' + views;
}

// various graph drawing functions
function graphYear(year) {
    currentYear = year;
    currentShow = null;
    graphData = [];
    for (var month = 1; month < 13; month++) {
        graphData[month - 1] = 0;
        if (shows[year][month]) {
            var count = 0;
            Object.keys(shows[year][month]).forEach(day => {
                Object.values(shows[year][month][day]).forEach(showCount => {
                    count += showCount;
                })
            })
            graphData[month - 1] = count;
        }
    }

    graph.data.labels = MONTH_LABELS;
    graph.data.datasets[0].data = graphData;
    graph.data.datasets[0].label = 'Watches per month in 20' + year;
    graph.update();

    setTotalViews(graphData);
}

function graphMonth(year, month, monthName) {
    console.log(shows);
    var days = new Date(year, month, 0).getDate();
    var labels = [];
    var graphData = [];
    for (var day = 0; day < days + 1; day++) {
        graphData[day] = 0;
        if (shows[year][month][day]) {
            Object.values(shows[year][month][day]).forEach(count => {
                graphData[day] += count;
            });
        }
        labels.push(day + 1);
    }

    graph.data.labels = labels;
    graph.data.datasets[0].data = graphData;
    graph.data.datasets[0].label = 'Watches in ' + monthName + ' 20' + year;
    graph.update();

    setTotalViews(graphData);
}

function graphShowYear(year, show) {
    currentYear = year;
    currentShow = show;
    graphData = [];
    for (var month = 1; month < 13; month++) {
        if (shows[year][month]) {
            graphData[month - 1] = 0;
            Object.keys(shows[year][month]).forEach(day => {
                if (shows[year][month][day][show]) {
                    graphData[month - 1] += shows[year][month][day][show];
                }
            })
        }
    }

    graph.data.labels = MONTH_LABELS;
    graph.data.datasets[0].data = graphData;
    graph.data.datasets[0].label = show + ' in 20' + year;
    graph.update();

    setTotalViews(graphData);
}

function graphShowMonth(year, month, monthName, show) {
    var days = new Date(year, month, 0).getDate();
    var labels = [];
    var graphData = [];
    for (var day = 0; day < days + 1; day++) {
        graphData[day] = 0;
        if (shows[year][month][day] && shows[year][month][day][show])
            graphData[day] = shows[year][month][day][show];
        labels.push(day + 1);
    }

    graph.data.labels = labels;
    graph.data.datasets[0].data = graphData;
    graph.data.datasets[0].label = show + ' in ' + monthName + ' 20' + year;
    graph.update();

    setTotalViews(graphData);
}

// open dropped / selected file
function readSingleFile(file) {
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
        var contents = e.target.result;
        var data = csvStringToArray(contents);
        processData(data);
    };
    reader.readAsText(file);
}

// drag and drop stuff
function dropHandler(ev) {
    ev.preventDefault();
    document.getElementById('drop_zone').style.display = "none";
    if (ev.dataTransfer.items) {
        var file = ev.dataTransfer.items[0].getAsFile();
        readSingleFile(file);
    }
}
function dragOverHandler(ev) {
    ev.preventDefault();
}
window.addEventListener("dragenter", function (e) {
    lastTarget = e.target;
    document.getElementById('drop_zone').style.display = "block";
});
window.addEventListener("dragleave", function (e) {
    if (e.target === lastTarget || e.target === document)
        document.getElementById('drop_zone').style.display = "none";
});

// graph click handler
function handleClick(evt) {
    const points = graph.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
    var monthNum = points[0].index + 1;
    var month = graph.data.labels[points[0].index];
    if (currentShow)
        graphShowMonth(currentYear, monthNum, month, currentShow)
    else
        graphMonth(currentYear, monthNum, month);
}

document.addEventListener("DOMContentLoaded", function () {
    // file selecter
    document.getElementById('file_opener').addEventListener('change', e => {
        readSingleFile(e.target.files[0]);
    }, false)

    // create graph
    Chart.defaults.color = '#fff';
    Chart.defaults.font.size = 16;

    graph = new Chart(document.getElementById('graph_canvas'), {
        responsive: true,
        maintainAspectRatio: false,
        type: 'bar',
        data: {
            labels: MONTH_LABELS,
            datasets: [{
                label: '',
                data: [],
                backgroundColor: 'rgb(229, 9, 20)',
                borderWidth: 1
            }]
        },
        options: {
            onClick: (e) => {
                handleClick(e);
            }
        },
    });
});

window.addEventListener('beforeprint', () => {
    myChart.resize(600, 600);
  });

window.addEventListener('afterprint', () => {
    graph.resize();
  });
