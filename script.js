function drawChart(data, width, height) {
  var activeTeam;
  var dullOpacity = 0.25;

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
    .scale(x);

  var positionLine = d3.line()
    .curve(d3.curveCatmullRom)
    .x(function(d) { return x(d.week); })
    .y(function(d) { return y(d.position); });

  var trans = d3.transition()
    .duration(750);

  var nestData = d3.nest()
    .key(function(d) { return d.team; })
    .entries(data);

  chart.append('g')
    .attr('class', 'axis x-axis')
    .attr('transform', 'translate(0,' + margin.top/2 + ')')
    .call(xAxis);

  function update() {
    chart.selectAll('.team-image')
      .transition(trans)
      .style('opacity', 0.75);
    chart.selectAll('.position-line').remove();
    chart.selectAll('.result-indicator').remove();
    
    if (activeTeam) {
      var teamNest = nestData.filter(function(d) { return d.key === activeTeam })[0];
      var weeklyOpponents = teamNest.values.map(function(d) { return d.opponent; });
      // dull other teams except in first last columns
      chart.selectAll('.team-image')
        .transition(trans)
        .style('opacity', function(d) {
          if (d.team !== activeTeam && weeklyOpponents[d.week] !== d.team) {
            return dullOpacity;
          } else if (d.team === activeTeam) {
            // hide image to show result indicator
            return 0;
          } else {
            return 1;
          }
        });
      // draw position line
      chart.append('path')
        .attr('class', 'position-line')
        .attr('stroke', function(d) {
          return colorsAndImages[activeTeam].color;
        })
        .attr('d', function(argument) {
          return positionLine(teamNest.values);
        });
      // draw result indicators
      var resultIndicators = chart.selectAll('.result-indicator')
        .data(data)
        .enter()
        .filter(function(d) { return d.team === activeTeam; });
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
        .attr('r', 8);
      // home or away
      resultIndicators.append('text')
        .attr('x', function(d) { return x(d.week); })
        .attr('y', function(d) { return y(d.position); })
        .attr('dy', '.25em')
        .attr('class', 'home-away-text')
        .text(function(d) { return d.home ? 'H' : 'A' });
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
    .attr('x', 20)
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
    });
  chart.selectAll('.team-final')
    .data(finalTeamPositions)
    .enter()
    .append('image')
    .attr('class', 'team-final')
    .attr('x', width - 20)
    .attr('y', function(d) { return y(d.position); })
    .attr('transform', 'translate(-8, -8)')
    .attr('width', 16)
    .attr('height', 16)
    .attr('xlink:href', function(d) {
      return colorsAndImages[d.team].icon;
    });
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