function drawChart(data, width, height) {
  var activeTeam;
  var dullOpacity = 0.1;
  var brightOpacity = 0.3;
  var transitionDuration = 1000;

  var margin = {
    top: 50,
    left: 75,
    right: 75,
    bottom: 50
  };

  var chart = d3.select('#chart')
    .attr('width', width)
    .attr('height', height);

  var weeks = d3.map(data, function(d) { return d.week; }).keys().map(function(d) { return Number(d); });
  var teams = d3.map(data, function(d) { return d.team; });

  // week
  var x = d3.scaleLinear()
    .range([margin.left, width - margin.right])
    .domain(d3.extent(weeks));

  // position
  var y = d3.scaleLinear()
    .range([margin.top, height - margin.bottom])
    .domain([1, 20]);

  var xAxis = d3.axisTop()
    .ticks(weeks.length/2)
    .tickFormat(function(d) { return 'W ' + d })
    .scale(x);

  var yAxis = d3.axisRight()
    .ticks(10)
    .scale(y);

  var positionLine = d3.line()
    .curve(d3.curveCatmullRom)
    .x(function(d) { return x(d.week); })
    .y(function(d) { return y(d.position); });

  var nestData = d3.nest()
    .key(function(d) { return d.team; })
    .entries(data);
  // show weeks
  chart.append('g')
    .attr('class', 'axis x-axis')
    .transition()
    .duration(transitionDuration)
    .attr('transform', 'translate(0,' + ((margin.top/2) - 5) + ')')
    .call(xAxis)
    .selectAll('text')
    .attr('dy', '1.2em')
    .attr('transform', 'rotate(-90)');
  // show position
  chart.append('g')
    .attr('class', 'axis y-axis')
    .attr('transform', 'translate(' + (x(38) + 20) + ', 0)')
    .transition()
    .duration(transitionDuration)
    .call(yAxis);

  function showTooltip(d) {
    var tooltipWidth = d.opponent.length * 7;
    var tooltip = chart.append('g')
      .attr('class', 'tooltip');
    var tooltipRect = tooltip.append('rect')
      .attr('width', 0)
      .attr('height', 40)
      .attr('fill', 'black')
      .attr('rx', 3)
      .attr('ry', 3)
      .style('opacity', 0)
      .attr('x', x(d.week))
      .attr('y', y(d.position) - 30)
      .transition()
      .duration(transitionDuration/2)
      .style('opacity', 0.5)
      .attr('width', tooltipWidth)
      .attr('y', y(d.position) - 60);
    var tooltipTeam = tooltip.append('text')
      .attr('fill', 'white')
      .style('opacity', 0)
      .attr('x', x(d.week) + 5)
      .attr('y', y(d.position) - 20)
      .transition()
      .duration(transitionDuration/2)
      .style('opacity', 1)
      .attr('y', y(d.position) - 42)
      .text(d.opponent);
    var tooltipScore = tooltip.append('text')
      .attr('fill', 'white')
      .style('opacity', 0)
      .attr('x', x(d.week) + 5)
      .attr('y', y(d.position) - 10)
      .transition()
      .duration(transitionDuration/2)
      .style('opacity', 1)
      .attr('y', y(d.position) - 28)
      .text(d.home ? d.goalsFor + ' - ' + d.goalsAgainst : d.goalsAgainst + ' - ' + d.goalsFor);
  }

  function hideTooltip(d) {
    chart.selectAll('.tooltip text')
      .transition()
      .duration(transitionDuration/2)
      .style('opacity', 0);
    chart.selectAll('.tooltip rect')
      .transition()
      .duration(transitionDuration/2)
      .style('opacity', 0)
      .attr('y', function() {
        return +d3.select(this).attr('y') + 40;
      })
      .attr('width', 0)
      .attr('height', 0);
    chart.select('.tooltip').transition().delay(transitionDuration/2).remove();
  }

  function update() {
    chart.selectAll('.team-image')
      .transition()
      .duration(transitionDuration)
      .style('opacity', brightOpacity);
    chart.selectAll('.result-indicator')
      .transition()
      .duration(transitionDuration)
      .attr('r', 0)
      .remove();

    if (!activeTeam) {
      chart.selectAll('.position-line')
        .transition()
        .duration(transitionDuration)
        .style('opacity', 0)
        .remove();

      chart.selectAll('.team-label')
        .transition()
        .duration(transitionDuration)
        .attr('transform', 'translate(50, ' + (height + 100) + ') rotate(-90)')
        .remove();
    }

    if (activeTeam) {
      var teamNest = nestData.filter(function(d) { return d.key === activeTeam })[0];
      var weeklyOpponents = teamNest.values.map(function(d) { return d.opponent; });
      // dull other teams except in first last columns
      chart.selectAll('.team-image')
        .transition()
        .duration(transitionDuration)
        .style('opacity', function(d) {
          if (d.team !== activeTeam && weeklyOpponents[d.week - 1] !== d.team) {
            return dullOpacity;
          } else if (d.team === activeTeam) {
            // hide image to show result indicator
            return 0;
          } else {
            return 1;
          }
        });

      var pl = chart.select('.position-line');
      if (chart.select('.position-line').size() < 1) {
        pl = chart.append('path')
          .attr('class', 'position-line');
      }
      // draw position line
      pl.transition()
        .duration(transitionDuration)
        .attr('stroke', function(d) {
          return colorsAndImages[activeTeam].color;
        })
        .attr('d', function(argument) {
          return positionLine(teamNest.values);
        });
      // draw result indicators
      var resultIndicators = chart.selectAll('.result-indicator')
        .data(data, function(d) { return d.week + '-' + d.team; })
        .enter()
        .filter(function(d) {
          return d.team === activeTeam;
        });
      // result colors
      resultIndicators.append('circle')
        .attr('class', function(d) {
          if (d.result === 'W') {
            return 'result-indicator win';
          } else if (d.result === 'L') {
            return 'result-indicator loss';
          } else {
            return 'result-indicator draw';
          }
        })
        .attr('cx', function(d) { return x(d.week); })
        .attr('cy', function(d) { return y(d.position); })
        .on('mouseover', function(d) {
          showTooltip(d);
        })
        .on('mouseout', function(d) {
          hideTooltip(d);
        })
        .transition()
        .duration(transitionDuration)
        .attr('r', 8);
      // home or away
      resultIndicators.append('text')
        .attr('x', function(d) { return x(d.week); })
        .attr('y', function(d) { return y(d.position); })
        .attr('dy', '.25em')
        .attr('class', 'home-away-text')
        .text(function(d) { return d.home ? 'H' : 'A' });
      // active team label
      var activeTeamLabel = chart.selectAll('.team-label');
      if (activeTeamLabel.size() < 1) {
        activeTeamLabel = chart.append('text')
          .attr('class', 'team-label')
          .attr('transform', 'translate(50,0) rotate(-90)');;
      }
      activeTeamLabel.style('text-anchor', 'middle')
        .text(activeTeam)
        .transition()
        .duration(transitionDuration)
        .attr('transform', 'translate(' + [50, (height - margin.top - margin.bottom)/2].join(',') + ') rotate(-90)');
    }
  };

  // draw table icons
  chart.selectAll('.team')
    .data(data)
    .enter()
    .append('image')
    .attr('class', 'team-image')
    .attr('x', function(d) { return x(d.week); })
    .attr('y', function(d) { return y(d.position); })
    .attr('transform', 'translate(-8, -8)')
    .transition()
    .duration(transitionDuration)
    .attr('width', 16)
    .attr('height', 16)
    .attr('xlink:href', function(d) {
      return colorsAndImages[d.team].icon;
    });

  // draw intial and final team positions
  var intialTeamPositions = nestData.map(function(d) { return d.key; }).sort();
  var finalTeamPositions = data.filter(function(d) { return d.week === 38 });
  chart.selectAll('.team-intial')
    .data(intialTeamPositions)
    .enter()
    .append('image')
    .attr('class', 'team-intial')
    .attr('x', -10)
    .attr('y', function(d, i) { return y(i + 1); })
    .attr('transform', 'translate(-8, -8)')
    .attr('width', 16)
    .attr('height', 16)
    .attr('xlink:href', function(d) {
      return colorsAndImages[d].icon;
    })
    .on('click', function(d) {
      if (activeTeam === d) {
        activeTeam = null;
      } else if (activeTeam !== d) {
        activeTeam = d;
      }
      update();
    })
    .transition()
    .duration(transitionDuration)
    .attr('x', 20);
  chart.selectAll('.team-final')
    .data(finalTeamPositions)
    .enter()
    .append('image')
    .attr('class', 'team-final')
    .attr('x', width + 10)
    .attr('y', function(d) { return y(d.position); })
    .attr('transform', 'translate(-8, -8)')
    .attr('width', 16)
    .attr('height', 16)
    .attr('xlink:href', function(d) {
      return colorsAndImages[d.team].icon;
    })
    .transition()
    .duration(transitionDuration)
    .attr('x', width - 20);
}

window.addEventListener('load', function() {
  d3.json('data.json', function(err, data) {
    var chartEl = document.querySelector('#chart');
    var rect = chartEl.getBoundingClientRect();
    drawChart(data, rect.width, rect.height);
  });
});

var colorsAndImages = {
  'West Bromwich Albion': {
    color: '#091453',
    icon: 'icons/West Bromwich Albion.ico'
  },
  'Arsenal': {
    color: '#EF0107',
    icon: 'icons/Arsenal.ico'
  },
  'Norwich City': {
    color: '#FFEA28',
    icon: 'icons/Norwich City.ico'
  },
  'Sunderland': {
    color: '#EB172B',
    icon: 'icons/Sunderland.ico'
  },
  'Tottenham Hotspur': {
    color: '#001C58',
    icon: 'icons/Tottenham Hotspur.ico'
  },
  'Stoke City': {
    color: '#E03A3E',
    icon: 'icons/Stoke City.ico'
  },
  'Bournemouth': {
    color: '#E62333',
    icon: 'icons/Bournemouth.png'
  },
  'Watford': {
    color: '#FFEE00',
    icon: 'icons/Watford FC.ico'
  },
  'Swansea City': {
    color: '#000000',
    icon: 'icons/Swansea City.ico'
  },
  'Southampton': {
    color: '#ED1A3B',
    icon: 'icons/Southampton FC.ico'
  },
  'Newcastle United': {
    color: '#BBBDBF',
    icon: 'icons/Newcastle United.ico'
  },
  'Everton': {
    color: '#274488',
    icon: 'icons/Everton.ico'
  },
  'Chelsea': {
    color: '#034694',
    icon: 'icons/Chelsea.ico'
  },
  'Manchester United': {
    color: '#DA020E',
    icon: 'icons/Manchester United.ico'
  },
  'Liverpool': {
    color: '#D00027',
    icon: 'icons/Liverpool FC.ico'
  },
  'Aston Villa': {
    color: '#94BEE5',
    icon: 'icons/Aston Villa.ico'
  },
  'West Ham United': {
    color: '#60223B',
    icon: 'icons/West Ham United.ico'
  },
  'Crystal Palace': {
    color: '#1B458F',
    icon: 'icons/Crystal Palace.png'
  },
  'Leicester City': {
    color: '#0053A0',
    icon: 'icons/Leicester City.ico'
  },
  'Manchester City': {
    color: '#5CBFEB',
    icon: 'icons/Manchester City.ico'
  }
};
