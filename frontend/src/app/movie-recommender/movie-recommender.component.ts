import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import * as d3 from 'd3';
import { take } from 'rxjs';
import { CommonService } from '../services/common.service';
import { environment } from 'src/environments/environment';
// import _ from "lodash";

@Component({
  selector: 'app-movie-recommender',
  templateUrl: './movie-recommender.component.html',
  styleUrls: ['./movie-recommender.component.css']
})
export class MovieRecommenderComponent implements OnInit {

  constructor(private commonService: CommonService, private router: Router) { }
  ngOnInit(): void {
    if (this.commonService.token === "" && (this.commonService.getToken() === "" || this.commonService.getToken() === undefined || this.commonService.getToken() === null)) {
      this.router.navigate(['login'])
    }
    console.log('token', this.commonService.token, this.commonService.getToken())

    if (this.commonService.getToken()) {
      this.commonService.token = this.commonService.getToken()
    }
    // throw new Error('Method not implemented.');
  }


  title = 'ng-d3-graph-editor';
  @ViewChild('graphContainer') graphContainer: ElementRef;

  width = 960;
  height = 600;
  colors = d3.scaleOrdinal(d3.schemeCategory10);

  svg: any;
  force: any;
  path: any;
  circle: any;
  drag: any;
  dragLine: any;
  filtersApplied = false;
  actorNameChbox = false;
  actorName = "";
  writerNameChbox = false;
  writerName = "";
  director = "";
  directorChbox = false;
  movieNameChbox = false;
  movieName = "";
  producerName = "";
  producerChbox = false;
  genreChbox = false;
  genres = [];
  genreList = ["Action", "Adventure", "Drama", "Fantasy", "Sci-fi"];
  movieClicked = false;
  clickedMovieDetails: any = {};
  newGivenRating;
  ratingGiven = false;
  type = "and";
  selectedRating;
  ratingChbox = false;


  // mouse event vars
  selectedNode = null;
  selectedLink = null;
  mousedownLink = null;
  mousedownNode = null;
  mouseupNode = null;

  lastNodeId = 0;
  // only respond once per keydown
  lastKeyDown = -1;

  mainResponse;
  nodeList = {
    '0': ['1'],
    '1': ['2', '3', '4'],
    '3': ['7'],
    '2': ['5', '6'],
    '6': ['2']
  }
  nodes = [
    // { id: 0, reflexive: false },
    // { id: 7, reflexive: false }
    // { id: 1, reflexive: true },
    // { id: 2, reflexive: false }
  ];
  links = [
    // { source: this.nodes[0], target: this.nodes[1], left: false, right: true },
    // { source: this.nodes[1], target: this.nodes[2], left: false, right: true }
  ];

  visited = {}

  pastLinks = {};

  checkUncheck(property, actorNameChbox) {
    if (!actorNameChbox) {
      if (property === 'genres') {
        this[property] = []
      }
      else {
        this[property] = ""
      }
    }

  }

  logOut() {
    this.commonService.doLogout();
  }

  changeAndOr(event) {
    if (event.checked) {
      this.type = 'and'
    } else {
      this.type = 'or'
    }
  }


  backendCall() {
    let url = "";
    let data: any = {};
    this.nodes = [];
    this.links = [];
    this.pastLinks = {};

    if (this.movieName !== '' && this.producerName === '' && this.actorName === '' && this.director === '' && this.writerName === '' && (this.selectedRating === null || this.selectedRating === undefined) && this.genres.length === 0) {
      url = `http://${environment.API_GATEWAY_DOMAIN}:3000/api/movie/movie-by-title`;
      data.movieTitle = this.movieName;
    }
    else if (this.movieName === '' && this.producerName !== '' && this.actorName === '' && this.director === '' && this.writerName === '' && (this.selectedRating === null || this.selectedRating === undefined) && this.genres.length === 0) {
      url = `http://${environment.API_GATEWAY_DOMAIN}:3000/api/movie/movie-by-producer`;
      data.producerName = this.producerName;
    }
    else if (this.movieName === '' && this.producerName === '' && this.actorName !== '' && this.director === '' && this.writerName === '' && (this.selectedRating === null || this.selectedRating === undefined) && this.genres.length === 0) {
      url = `http://${environment.API_GATEWAY_DOMAIN}:3000/api/movie/movie-by-actor`;
      data.actorName = this.actorName;
    }
    else if (this.movieName === '' && this.producerName === '' && this.actorName === '' && this.director !== '' && this.writerName === '' && (this.selectedRating === null || this.selectedRating === undefined) && this.genres.length === 0) {
      url = `http://${environment.API_GATEWAY_DOMAIN}:3000/api/movie/movie-by-director`;
      data.directorName = this.director;

    }
    else if (this.movieName === '' && this.producerName === '' && this.actorName === '' && this.director === '' && this.writerName !== '' && (this.selectedRating === null || this.selectedRating === undefined) && this.genres.length === 0) {
      url = `http://${environment.API_GATEWAY_DOMAIN}:3000/api/movie/movie-by-writer`;
      data.writerName = this.writerName;

    }
    else if (this.movieName === '' && this.producerName === '' && this.actorName === '' && this.director === '' && this.writerName === '' && (this.selectedRating === null || this.selectedRating === undefined) && this.genres.length > 0) {
      url = `http://${environment.API_GATEWAY_DOMAIN}:3000/api/movie/movie-by-genre`;
      data.genres = this.genres.join(',');
      data.type = this.type;

    }
    else if (this.movieName === '' && this.producerName === '' && this.actorName === '' && this.director === '' && this.writerName === '' && (this.selectedRating !== null || this.selectedRating !== undefined) && this.genres.length === 0) {
      url = `http://${environment.API_GATEWAY_DOMAIN}:3000/api/movie/movie-by-rating`;
      data.rating = this.selectedRating;
      // data.type = this.type;

    }
    else {
      url = `http://${environment.API_GATEWAY_DOMAIN}:3000/api/movie/movie-by-multiple-parameters`;
      this.movieName ? data.movieTitle = this.movieName : delete data.movieTitle;
      this.producerName ? data.producerName = this.producerName : delete data.producerName;
      this.actorName ? data.actorName = this.actorName : delete data.actorName;
      this.director ? data.directorName = this.director : delete data.directorName;
      this.writerName ? data.writerName = this.writerName : delete data.writerName;
      this.selectedRating ? data.rating = this.selectedRating : delete data.rating;
      this.genres.length > 0 ? data.genres = this.genres.join(',') : delete data.genres;
      data.type = this.type;


    }

    this.commonService.movieRecommenderCall(url, data).pipe(take(1)).subscribe((response) => {
      console.log(response);
      if (response.length > 5) {
        this.mainResponse = JSON.parse(JSON.stringify(response));
        response = this.limitRes(response);
      }
      this.nodes = response;
      this.setNodesList();
      if (this.nodes.length > 1) {
        this.setLinks();
      }
      this.applyFilters();
    })
  }

  limitRes(response) {
    let arr = [];
    for (let i = 0; i < response.length - 1; i++) {
      let movie1 = response[i];
      for (let j = i + 1; j < response.length; j++) {
        let movie2 = response[j];
        const filteredArray = movie1['genres'].split(',').filter(value => movie2['genres'].split(',').includes(value));
        // let newArr = arr.filter(value => value.genre.split(',').includes());
        if (filteredArray.length === 0 && arr.filter((a) => (a.title === movie1.title || a.title === movie2.title)).length === 0) {
          arr.push(movie1);
          response.splice(i, 1);
          arr.push(movie2);
          response.splice(j - 1, 1);
          i--;
          j--;
        }
        if (arr.length >= 5) {
          return arr;
        }
      }
    }

    if (arr.length === 0) {
      arr = response.splice(0, 5);
    }

    return arr;
  }

  setLinks() {
    for (let i = 0; i < this.nodes.length - 1; i++) {
      let movie1 = this.nodes[i];
      for (let j = i + 1; j < this.nodes.length; j++) {
        let movie2 = this.nodes[j];
        const filteredArray = movie1['genres'].split(',').filter(value => movie2['genres'].split(',').includes(value));
        if (filteredArray.length > 0) {
          let link = {
            source: movie1, target: movie2, left: false, right: true
          }
          this.links.push(link);

          if (!this.pastLinks[movie2.title]) {
            this.pastLinks[movie2.title] = [];
          }
          // if (movie.title !== mouseNodeTemp.title) {
          this.pastLinks[movie2.title].push(movie1.title)
          if (this.pastLinks[movie1.title]) {
            this.pastLinks[movie2.title] = this.pastLinks[movie2.title].concat(this.pastLinks[movie1.title]);
          }
          // }
        }


      }
    }
  }

  uploadRating() {
    this.ratingGiven = true;
    this.clickedMovieDetails['Your review'] = this.newGivenRating;
    this.commonService.uploadRatings({ review: this.newGivenRating, movieId: this.clickedMovieDetails.movieid }).pipe(take(1)).subscribe((res) => {
      console.log("Review posted")
      // this.applyFilters();
    })
  }

  setNodesList() {

  }

  applyFilters() {
    this.filtersApplied = true;
    const rect = this.graphContainer.nativeElement.getBoundingClientRect();
    console.log(rect.width, rect.height);

    this.width = rect.width;

    this.svg = d3.select('#graphContainer')
      .attr('oncontextmenu', 'return false;')
      .attr('width', this.width)
      .attr('height', this.height);

    this.force = d3.forceSimulation()
      .force('link', d3.forceLink().id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('x', d3.forceX(this.width / 2))
      .force('y', d3.forceY(this.height / 2))
      .on('tick', () => this.tick());

    // init D3 drag support
    this.drag = d3.drag()
      .on('start', (d: any) => {
        if (!d3.event.active) this.force.alphaTarget(0.3).restart();

        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (d: any) => {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      })
      .on('end', (d: any) => {
        if (!d3.event.active) this.force.alphaTarget(0.3);

        d.fx = null;
        d.fy = null;
      });


    // define arrow markers for graph links
    this.svg.append('svg:defs').append('svg:marker')
      .attr('id', 'end-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 6)
      .attr('markerWidth', 3)
      .attr('markerHeight', 3)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#000');

    this.svg.append('svg:defs').append('svg:marker')
      .attr('id', 'start-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 4)
      .attr('markerWidth', 3)
      .attr('markerHeight', 3)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M10,-5L0,0L10,5')
      .attr('fill', '#000');


    // line displayed when dragging new nodes
    this.dragLine = this.svg.append('svg:path')
      .attr('class', 'link dragline hidden')
      .attr('d', 'M0,0L0,0');

    // handles to link and node element groups
    this.path = this.svg.append('svg:g').selectAll('path');
    this.circle = this.svg.append('svg:g').selectAll('g');

    // app starts here
    this.svg.on('mousedown', (dataItem, value, source) => this.mousedown(dataItem, value, source))
      //   .on('mousemove', (dataItem) => this.mousemove(dataItem))
      .on('mouseup', (dataItem) => this.mouseup(dataItem));
    // d3.select(window)
    //   .on('keydown', this.keydown)
    //   .on('keyup', this.keyup);
    this.restart();
  }


  // update force layout (called automatically each iteration)
  tick() {
    // draw directed edges with proper padding from node centers
    this.path.attr('d', (d: any) => {
      const deltaX = d.target.x - d.source.x;
      const deltaY = d.target.y - d.source.y;
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const normX = dist !== 0 ? deltaX / dist : 0;
      const normY = dist !== 0 ? deltaY / dist : 0;
      const sourcePadding = d.left ? 17 : 12;
      const targetPadding = d.right ? 17 : 12;
      const sourceX = d.source.x + (sourcePadding * normX);
      const sourceY = d.source.y + (sourcePadding * normY);
      const targetX = d.target.x - (targetPadding * normX);
      const targetY = d.target.y - (targetPadding * normY);

      return `M${sourceX},${sourceY}L${targetX},${targetY}`;
    });

    this.circle.attr('transform', (d) => `translate(${d.x},${d.y})`);
  }

  resetMouseVars() {
    this.mousedownNode = null;
    this.mouseupNode = null;
    this.mousedownLink = null;
  }

  // update graph (called when needed)
  restart() {
    // path (link) group
    this.path = this.path.data(this.links);

    // update existing links
    this.path.classed('selected', (d) => d === this.selectedLink)
      .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '')
      .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '');

    // remove old links
    this.path.exit().remove();

    // add new links
    this.path = this.path.enter().append('svg:path')
      .attr('class', 'link')
      .classed('selected', (d) => d === this.selectedLink)
      .style('marker-start', (d) => d.left ? 'url(#start-arrow)' : '')
      .style('marker-end', (d) => d.right ? 'url(#end-arrow)' : '')
      .on('mousedown', (d) => {
        if (d3.event.ctrlKey) return;

        // select link
        this.mousedownLink = d;
        this.selectedLink = (this.mousedownLink === this.selectedLink) ? null : this.mousedownLink;
        this.selectedNode = null;
        this.restart();
      })
      .merge(this.path);

    // circle (node) group
    // NB: the function arg is crucial here! nodes are known by id, not by index!
    this.circle = this.circle.data(this.nodes, (d) => d.title);

    // update existing nodes (reflexive & selected visual states)
    this.circle.selectAll('circle')
      .style('fill', (d) => (d === this.selectedNode) ? d3.rgb(this.colors(d.title)).brighter().toString() : this.colors(d.title))
      .classed('reflexive', (d) => d.reflexive)
      .classed('collapsed', (d) => !this.visited[d.title] && this.nodeList[d.title] && this.nodeList[d.title].length > 0);

    // remove old nodes
    this.circle.exit().remove();

    // add new nodes
    const g = this.circle.enter().append('svg:g');

    g.append('svg:circle')
      .attr('class', 'node')
      .attr('r', 12)
      .style('fill', (d) => (d === this.selectedNode) ? d3.rgb(this.colors(d.title)).brighter().toString() : this.colors(d.title))
      .style('stroke', (d) => d3.rgb(this.colors(d.title)).darker().toString())
      .classed('reflexive', (d) => d.reflexive)
      .on('mouseover', function (d) {
        if (!this.mousedownNode || d === this.mousedownNode) return;
        // enlarge target node
        d3.select(this).attr('transform', 'scale(1.1)');
      })
      .on('mouseout', function (d) {
        if (!this.mousedownNode || d === this.mousedownNode) return;
        // unenlarge target node
        d3.select(this).attr('transform', '');
      })
      .on('mousedown', (d) => {
        if (d3.event.ctrlKey) return;

        // select node
        this.mousedownNode = d;
        this.selectedNode = (this.mousedownNode === this.selectedNode) ? null : this.mousedownNode;
        this.selectedLink = null;

        // reposition drag line
        this.dragLine
          .style('marker-end', 'url(#end-arrow)')
          .classed('hidden', false)
          .attr('d', `M${this.mousedownNode.x},${this.mousedownNode.y}L${this.mousedownNode.x},${this.mousedownNode.y}`);

        this.restart();
      })
      .on('mouseup', (dataItem: any) => {
        debugger;
        if (!this.mousedownNode) return;

        // needed by FF
        this.dragLine
          .classed('hidden', true)
          .style('marker-end', '');

        // check for drag-to-self
        this.mouseupNode = dataItem;
        if (this.mouseupNode === this.mousedownNode) {
          this.resetMouseVars();
          return;
        }

        // unenlarge target node
        d3.select(d3.event.currentTarget).attr('transform', '');

        // add link to graph (update if exists)
        // NB: links are strictly source < target; arrows separately specified by booleans
        const isRight = this.mousedownNode.title < this.mouseupNode.title;
        const source = isRight ? this.mousedownNode : this.mouseupNode;
        const target = isRight ? this.mouseupNode : this.mousedownNode;

        const link = this.links.filter((l) => l.source === source && l.target === target)[0];
        if (link) {
          link[isRight ? 'right' : 'left'] = true;
        } else {
          this.links.push({ source, target, left: !isRight, right: isRight });
        }

        // select new link
        this.selectedLink = link;
        this.selectedNode = null;
        this.restart();
      });

    // show node IDs
    g.append('svg:text')
      .attr('x', 0)
      .attr('y', 4)
      .attr('class', 'id')
      .text((d) => d.title);

    this.circle = g.merge(this.circle);

    // set the graph in motion
    this.force
      .nodes(this.nodes)
      .force('link').links(this.links);

    this.force.alphaTarget(0.3).restart();
  }

  setClickedMovieDetails(movieTitle) {
    this.clickedMovieDetails = this.nodes.filter((node) => node.title === movieTitle)[0];
  }

  mousedown(dataItem: any, value: any, source: any) {
    dataItem;
    value;
    source;
    // because :active only works in WebKit?
    this.svg.classed('active', true);
    const point = d3.mouse(d3.event.currentTarget);
    if (this.mousedownNode) {
      this.clickedMovieDetails = {};
      this.setClickedMovieDetails(this.mousedownNode.title);
    }

    // if (d3.event.ctrlKey || this.mousedownNode || this.mousedownLink) return;

    if (this.mousedownNode) {
      if (!this.visited[this.mousedownNode.title]) {
        let data: any = {}
        data.genres = this.mousedownNode.genres;
        data.type = this.type;
        let mousenodeTitle = this.mousedownNode.title;
        let mouseNodeTemp = this.mousedownNode;
        let movieId = this.mousedownNode.movieid;
        console.log('movieid', movieId)
        this.commonService.getMovieDetails(`http://${environment.API_GATEWAY_DOMAIN}:3000/api/movie/actors-by-movie`, movieId).pipe(take(1)).subscribe((res1) => {
          let arr = []
          console.log('res1', res1)
          for (let a of res1) {
            arr.push(a.Name);
          }
          console.log('arr', arr)
          this.clickedMovieDetails.Actors = arr.join(', ');
          this.commonService.getMovieDetails(`http://${environment.API_GATEWAY_DOMAIN}:3000/api/movie/directors-by-movie`, movieId).pipe(take(1)).subscribe((res2) => {
            let arr = []
            for (let a of res2) {
              arr.push(a.Name);
            }
            this.clickedMovieDetails.Directors = arr.join(', ');
            this.commonService.getMovieDetails(`http://${environment.API_GATEWAY_DOMAIN}:3000/api/movie/producers-by-movie`, movieId).pipe(take(1)).subscribe((res3) => {
              let arr = []
              for (let a of res3) {
                arr.push(a.Name);
              }
              this.clickedMovieDetails.Producers = arr.join(', ');
              this.commonService.getMovieDetails(`http://${environment.API_GATEWAY_DOMAIN}:3000/api/movie/writers-by-movie`, movieId).pipe(take(1)).subscribe((res4) => {
                let arr = []
                for (let a of res4) {
                  arr.push(a.Name);
                }
                this.clickedMovieDetails.Writers = arr.join(', ');
                this.commonService.getMovieDetails(`http://${environment.API_GATEWAY_DOMAIN}:3000/api/movie/reviews-by-movie`, movieId).pipe(take(1)).subscribe((res5) => {
                  let arr = {}
                  for (let a of res5) {
                    arr[a.Reviewer] = a;
                  }
                  this.clickedMovieDetails.Reviews = arr;
                  this.movieClicked = true;


                  this.commonService.movieRecommenderCall(`http://${environment.API_GATEWAY_DOMAIN}:3000/api/movie/movie-by-genre`, data, false).pipe(take(1)).subscribe((res) => {
                    console.log('not iterable', res)
                    let cnt = 0;
                    for (let movie of res) {
                      if (cnt > 9) {
                        break;
                      }
                      if (this.nodes.filter((node) => node.title === movie.title).length === 0) {
                        this.nodes.push(movie);
                        if (movie.title !== mouseNodeTemp.title && (!this.pastLinks[mousenodeTitle] || this.pastLinks[mousenodeTitle].indexOf(movie.title) === -1)) {
                          this.links.push({
                            source: mouseNodeTemp,
                            target: movie,
                            left: false,
                            right: true
                          })
                          cnt++;
                        }

                        if (!this.pastLinks[movie.title]) {
                          this.pastLinks[movie.title] = [];
                        }
                        if (movie.title !== mouseNodeTemp.title) {
                          this.pastLinks[movie.title].push(mousenodeTitle)
                          if (this.pastLinks[mousenodeTitle]) {
                            this.pastLinks[movie.title] = this.pastLinks[movie.title].concat(this.pastLinks[mousenodeTitle]);
                          }
                        }

                      }

                    }
                    this.visited[mouseNodeTemp.title] = true;

                    this.restart();

                  })
                })
              })
            })
          })
        })

      }
      else {
        this.movieClicked = true;
        let nodeTitle = this.mousedownNode.title
        this.visited[nodeTitle] = false;

        for (let j = Object.keys(this.pastLinks).length - 1; j >= 0; j--) {
          let movieTitle = Object.keys(this.pastLinks)[j];
          if (this.pastLinks[movieTitle].includes(nodeTitle) || this.pastLinks[movieTitle].includes(nodeTitle)) {
            let x = this.nodes.findIndex((ss) => ss.title === (movieTitle))
            let y = this.nodes[x];

            if (x !== -1) {
              this.visited[y.title] = false;
              this.nodes.splice(x, 1);
            }
            for (let i = this.links.length - 1; i >= 0; i--) {
              let link = this.links[i];
              if (link.source.title === y.title || link.target.title === y.title) {
                this.links.splice(i, 1);
              }
            }
            delete this.pastLinks[movieTitle];

          }
        }

        this.restart();

      }
    }





  }



  //   mousemove(source: any) {
  //     if (!this.mousedownNode) return;

  //     // update drag line
  //     this.dragLine.attr('d', `M${this.mousedownNode.x},${this.mousedownNode.y}L${d3.mouse(d3.event.currentTarget)[0]},${d3.mouse(d3.event.currentTarget)[1]}`);

  //     this.restart();
  //   }

  mouseup(source: any) {
    if (this.mousedownNode) {
      // hide drag line
      this.dragLine
        .classed('hidden', true)
        .style('marker-end', '');
    }

    // because :active only works in WebKit?
    this.svg.classed('active', false);

    // clear mouse event vars
    this.resetMouseVars();
  }

  //   spliceLinksForNode(node) {
  //     const toSplice = this.links.filter((l) => l.source === node || l.target === node);
  //     for (const l of toSplice) {
  //       this.links.splice(this.links.indexOf(l), 1);
  //     }
  //   }

  //   keydown() {
  //     d3.event.preventDefault();

  //     if (this.lastKeyDown !== -1) return;
  //     this.lastKeyDown = d3.event.keyCode;

  //     // ctrl
  //     if (d3.event.keyCode === 17) {
  //       this.circle.call(this.drag);
  //       this.svg.classed('ctrl', true);
  //     }

  //     if (!this.selectedNode && !this.selectedLink) return;

  //     switch (d3.event.keyCode) {
  //       case 8: // backspace
  //       case 46: // delete
  //         if (this.selectedNode) {
  //           this.nodes.splice(this.nodes.indexOf(this.selectedNode), 1);
  //           this.spliceLinksForNode(this.selectedNode);
  //         } else if (this.selectedLink) {
  //           this.links.splice(this.links.indexOf(this.selectedLink), 1);
  //         }
  //         this.selectedLink = null;
  //         this.selectedNode = null;
  //         this.restart();
  //         break;
  //       case 66: // B
  //         if (this.selectedLink) {
  //           // set link direction to both left and right
  //           this.selectedLink.left = true;
  //           this.selectedLink.right = true;
  //         }
  //         this.restart();
  //         break;
  //       case 76: // L
  //         if (this.selectedLink) {
  //           // set link direction to left only
  //           this.selectedLink.left = true;
  //           this.selectedLink.right = false;
  //         }
  //         this.restart();
  //         break;
  //       case 82: // R
  //         if (this.selectedNode) {
  //           // toggle node reflexivity
  //           this.selectedNode.reflexive = !this.selectedNode.reflexive;
  //         } else if (this.selectedLink) {
  //           // set link direction to right only
  //           this.selectedLink.left = false;
  //           this.selectedLink.right = true;
  //         }
  //         this.restart();
  //         break;
  //     }
  //   }

  //   keyup() {
  //     this.lastKeyDown = -1;

  //     // ctrl
  //     if (d3.event.keyCode === 17) {
  //       this.circle.on('.drag', null);
  //       this.svg.classed('ctrl', false);
  //     }
  //   }


}
