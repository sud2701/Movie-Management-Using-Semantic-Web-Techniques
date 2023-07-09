const expressObject = require('express');
const app = expressObject();
const connection = require("./db/database");
const dotenv = require('dotenv');
const requestObject = require('request');
var querystring = require('querystring');
const cors = require('cors');
const sendToQueue = require('./queue/sender');
app.use(expressObject.json());
dotenv.config();

connection();

app.use(expressObject.json());
const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions));

app.listen(8081);
console.log("Server is listening port 8081 !!!!");

function getMovie(movieID, movieDetails) {
  const functioPromise = new Promise((resolve, reject) => {
    var query = querystring.stringify({
      "query": `PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX mov: <http://www.semanticweb.org/ser531-team16/movie#>
      SELECT DISTINCT ?Title ?Movieid ?Year ?Genre ?RunTime ?Rating ?Votes ?OriginalTitle ?Adult WHERE {
        ?movID a mov:MovieID.
        ?movID mov:isMovieID ?Movieid.
        ?movID mov:hasPrimaryTitle ?pt.
        ?pt mov:isPrimaryTitle ?Title.
        FILTER(?Movieid = "${movieID}"^^xsd:string).
        ?movID mov:hasGenre ?g.
        ?g mov:isGenre ?Genre.
        ?movID mov:isAdult ?Adult.
        ?movID mov:hasReleaseYear ?ry.
        ?ry mov:isReleaseYear ?Year.
        ?movID mov:hasRating ?R.
        ?R mov:isRating ?Rating.
        ?movID mov:hasRunTime ?rt.
        ?rt mov:isRunTime ?RunTime.
        ?movID mov:hasVotes ?v.
        ?v mov:isVotes ?Votes.
        ?movID mov:hasSecondaryTitle ?st.
        ?st mov:isSecondaryTitle ?OriginalTitle.
      } ORDER BY DESC(?Rating) LIMIT 100`});
    try {
      requestObject.post({ headers: { 'content-type': 'application/x-www-form-urlencoded', 'accept': 'application/json' }, url: `http://${process.env.FUSEKI}:3030/movie-management/?` + query }, function (error, res, body) {
        movieDetails.push(JSON.parse(body).results.bindings);
        resolve();
      });
    } catch (err) {
      reject();
    }
  });
  return functioPromise;
}

async function getMovieDetails(listOfMovies, callback) {
  try {
    const promiseArray = [];
    const movieDetails = []
    listOfMovies.forEach((movie) => {
      promiseArray.push(getMovie(movie.MovieID.value, movieDetails));
    });
    await Promise.all(promiseArray).then(_ => {
      for (let index = 0; index < listOfMovies.length; index++) {
        listOfMovies[index] = movieDetails[index][0];
      }
    })
    callback(listOfMovies);
  } catch (error) {
    throw error
  }
}

function callToFuseki(response, query, fusekiDatabase) {
  requestObject.post({ headers: { 'content-type': 'application/x-www-form-urlencoded', 'accept': 'application/json' }, url: `http://${process.env.FUSEKI}:3030/${fusekiDatabase}/?` + query }, function (error, res, body) {
    var details = JSON.parse(body).results.bindings;
    getMovieDetails(details, (movieDetails) => {
      var parsedMovieData = [];
      // movieDetails = movieDetails.results.bindings;
      movieDetails.forEach(movieData => {
        parsedMovieData.push({
          title: movieData.Title.value,
          year: movieData.Year.value,
          genres: movieData.Genre.value,
          runtime: movieData.RunTime.value,
          rating: movieData.Rating.value,
          votes: parseInt(movieData.Votes.value),
          isAdult: movieData.Adult.value == 0 ? false : true,
          movieid: movieData.Movieid.value,
        });
      });
      parsedMovieData = parsedMovieData.sort((a, b) => a.votes > b.votes ? -1 : 1);
      response.send(parsedMovieData);
    });
  });
}

app.get('/movie-by-title', (request, response) => {
  const movieTitle = request.query.movieTitle;
  var query = querystring.stringify({ "query": `PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> PREFIX mov: <http://www.semanticweb.org/ser531-team16/movie#> SELECT ?Title ?Year ?Movieid ?Genre ?RunTime ?Rating ?Votes ?Adult ?OriginalTitle WHERE { ?movID a mov:MovieID. ?movID mov:isMovieID ?Movieid. ?movID mov:hasPrimaryTitle ?pt. ?pt mov:isPrimaryTitle ?Title. FILTER(STRSTARTS(?Title , "${movieTitle}"^^xsd:string)). ?movID mov:hasGenre ?g. ?g mov:isGenre ?Genre. ?movID mov:isAdult ?Adult. ?movID mov:hasReleaseYear ?ry. ?ry mov:isReleaseYear ?Year. ?movID mov:hasRating ?R. ?R mov:isRating ?Rating. ?movID mov:hasRunTime ?rt. ?rt mov:isRunTime ?RunTime. ?movID mov:hasVotes ?v. ?v mov:isVotes ?Votes. ?movID mov:hasSecondaryTitle ?st. ?st mov:isSecondaryTitle ?OriginalTitle. } ORDER BY DESC(?Rating) LIMIT 100` });
  requestObject.post({ headers: { 'content-type': 'application/x-www-form-urlencoded', 'accept': 'application/json' }, url: `http://${process.env.FUSEKI}:3030/movie-management/?` + query }, function (error, res, body) {
    var movieDetails = JSON.parse(body).results.bindings;
    var parsedMovieData = [];
    movieDetails.forEach(movieData => {
      parsedMovieData.push({
        title: movieData.Title.value,
        year: movieData.Year.value,
        genres: movieData.Genre.value,
        runtime: movieData.RunTime.value,
        rating: movieData.Rating.value,
        votes: parseInt(movieData.Votes.value),
        isAdult: movieData.Adult.value == 0 ? false : true,
        movieid: movieData.Movieid.value,
      });
    });
    parsedMovieData = parsedMovieData.sort((a, b) => a.votes > b.votes ? -1 : 1);
    response.send(parsedMovieData);
  });
});

app.get('/movie-by-genre', (request, response) => {
  var genreList = request.query.genres;
  var typeOfQuery = request.query.type;

  genreList = genreList.split(',');
  var queryList = [];
  genreList.forEach((genre) => {
    queryList.push(`{?movID mov:hasGenre ?g.
        ?g mov:isGenre ?Genre.
        FILTER(CONTAINS(lcase(str(?Genre)), "${genre.toLowerCase(0)}"^^xsd:string)).}`)
  });
  if (typeOfQuery == 'or') {
    queryList = queryList.join([separator = ' UNION ']);
  } else {
    queryList = queryList.join([separator = ' . ']);
  }
  var query = querystring.stringify({
    "query": `PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX mov: <http://www.semanticweb.org/ser531-team16/movie#>
    SELECT ?Title ?Year ?Movieid ?Genre ?RunTime ?Rating ?Votes ?Adult ?OriginalTitle WHERE {
      ?movID a mov:MovieID.
      ?movID mov:isMovieID ?Movieid.
      ?movID mov:hasPrimaryTitle ?pt.
      ?pt mov:isPrimaryTitle ?Title.
      ${queryList}
      ?movID mov:isAdult ?Adult.
      ?movID mov:hasReleaseYear ?ry.
      ?ry mov:isReleaseYear ?Year.
      ?movID mov:hasRating ?R.
      ?R mov:isRating ?Rating.
      ?movID mov:hasRunTime ?rt.
      ?rt mov:isRunTime ?RunTime.
      ?movID mov:hasVotes ?v.
      ?v mov:isVotes ?Votes.
      ?movID mov:hasSecondaryTitle ?st.
      ?st mov:isSecondaryTitle ?OriginalTitle.
    } ORDER BY DESC(?Year) LIMIT 1000`});
  requestObject.post({ headers: { 'content-type': 'application/x-www-form-urlencoded', 'accept': 'application/json' }, url: `http://${process.env.FUSEKI}:3030/movie-management/?` + query }, function (error, res, body) {
    var movieDetails = JSON.parse(body).results.bindings;
    var parsedMovieData = [];
    movieDetails.forEach(movieData => {
      parsedMovieData.push({
        title: movieData.Title.value,
        year: movieData.Year.value,
        genres: movieData.Genre.value,
        runtime: movieData.RunTime.value,
        rating: movieData.Rating.value,
        votes: parseInt(movieData.Votes.value),
        isAdult: movieData.Adult.value == 0 ? false : true,
        movieid: movieData.Movieid.value,
      });
    });
    // console.log('parsedMovieData', parsedMovieData)
    parsedMovieData = parsedMovieData.sort((a, b) => a.votes < b.votes ? 1 : -1);
    response.send(parsedMovieData);
  });
});

app.get('/movie-by-actor', (request, response) => {
  const actorName = request.query.actorName;
  var q = querystring.stringify({
    "query": `PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX act: <http://www.semanticweb.org/ser531-team16/actor#>
    SELECT ?ActorID ?Name ?MovieID ?knownfor WHERE {
      ?actID a act:ActorID.
      ?actID act:hasActorID ?ActorID.
      ?actID act:hasActedIn ?MID.
      ?MID act:hasMovieID ?MovieID.
      ?actID act:hasPrimaryName ?Name.
      FILTER(?Name = "${actorName}").
      ?actID act:knownFor ?knownfor.
    } ORDER BY(?Name)`});
  callToFuseki(response, q, 'actor');
});

app.get('/movie-by-director', (request, response) => {
  const directorName = request.query.directorName;
  var q = querystring.stringify({
    "query": `PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX dir: <http://www.semanticweb.org/ser531-team16/director#>
    SELECT ?DirectorID ?Name ?MovieID ?knownfor WHERE {
      ?dirID a dir:DirectorID.
      ?dirID dir:hasID ?DirectorID.
      ?dirID dir:hasDirected ?MID.
      ?MID dir:hasMovieID ?MovieID.
      ?dirID dir:hasPrimaryName ?Name.
      FILTER(?Name = "${directorName}").
      ?dirID dir:knownFor ?knownfor.
    } ORDER BY(?Name)`});
  callToFuseki(response, q, 'director');
});

app.get('/movie-by-producer', (request, response) => {
  const producerName = request.query.producerName;
  var q = querystring.stringify({
    "query": `PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX prod: <http://www.semanticweb.org/ser531-team16/producer#>
    SELECT ?ProducerID ?MovieID ?Name ?knownfor WHERE {
      ?prodID a prod:ProducerID.
      ?prodID prod:hasID ?ProducerID.
      ?prodID prod:hasProduced ?MID.
      ?MID prod:hasMovieID ?MovieID.
      ?prodID prod:hasPrimaryName ?Name.
      FILTER(?Name = "${producerName}").
      ?prodID prod:knownFor ?knownfor.
    } ORDER BY(?Name)`});
  callToFuseki(response, q, 'producer');
});

app.get('/movie-by-writer', (request, response) => {
  const writerName = request.query.writerName;
  var q = querystring.stringify({
    "query": `PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX wri: <http://www.semanticweb.org/ser531-team16/writer#>
    SELECT ?WriterID ?Name ?MovieID ?knownfor WHERE {
      ?wriID a wri:WriterID.
      ?wriID wri:hasID ?WriterID.
      ?wriID wri:hasWritten ?MID.
      ?MID wri:hasMovieID ?MovieID.
      ?wriID wri:hasPrimaryName ?Name.
      FILTER(?Name = "${writerName}").
      ?wriID wri:knownFor ?knownfor.
    } ORDER BY(?Name)`});
  callToFuseki(response, q, 'writer');
});

app.get('/movie-by-multiple-parameters', (request, response) => {
  var isFirst = true;
  const movieTitle = request.query.movieTitle;
  var genreList = request.query.genres;
  const actorName = request.query.actorName;
  const directorName = request.query.directorName;
  const producerName = request.query.producerName;
  const writerName = request.query.writerName;
  const type = request.query.type == "and" ? " . " : " UNION ";
  var myQuery = `PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX mov: <http://www.semanticweb.org/ser531-team16/movie#>
  PREFIX act: <http://www.semanticweb.org/ser531-team16/actor#>
  PREFIX dir: <http://www.semanticweb.org/ser531-team16/director#>
  PREFIX prod: <http://www.semanticweb.org/ser531-team16/producer#>
  PREFIX wri: <http://www.semanticweb.org/ser531-team16/writer#>
  SELECT ?Title ?Year ?Movieid ?Genre ?RunTime ?Rating ?Votes ?OriginalTitle WHERE { `
  var movieQuery = `
    {?movID a mov:MovieID.
    ?movID mov:isMovieID ?Movieid. 
    ?movID mov:hasPrimaryTitle ?pt.
    ?pt mov:isPrimaryTitle ?Title.
    ?movID mov:hasGenre ?g.
    ?g mov:isGenre ?Genre.
    ?movID mov:isAdult ?Adult.
    ?movID mov:hasReleaseYear ?ry.
    ?ry mov:isReleaseYear ?Year.
    ?movID mov:hasRating ?R.
    ?R mov:isRating ?Rating.
    ?movID mov:hasRunTime ?rt.
    ?rt mov:isRunTime ?RunTime.
    ?movID mov:hasVotes ?v.
    ?v mov:isVotes ?Votes.
    ?movID mov:hasSecondaryTitle ?st.
    ?st mov:isSecondaryTitle ?OriginalTitle.
    FILTER(STRSTARTS(?Title, "${movieTitle}")).}`;

  if (movieTitle) {
    isFirst = false;
    myQuery = myQuery.concat(movieQuery);
  }

  if (genreList) {
    genreList = genreList.split(',');
    var generQueryList = [];
    genreList.forEach((genre) => {
      generQueryList.push(`{?movID mov:hasGenre ?g.
        ?g mov:isGenre ?Genre.
        FILTER(CONTAINS(lcase(str(?Genre)), "${genre.toLowerCase(0)}"^^xsd:string)).}`)
    });
    generQueryList = generQueryList.join([separator = ' UNION ']);
    genreQuery = `{
    ?movID a mov:MovieID.
    ?movID mov:isMovieID ?Movieid.
    ?movID mov:hasPrimaryTitle ?pt.
    ?pt mov:isPrimaryTitle ?Title.
    ${generQueryList}
    ?movID mov:isAdult ?Adult.
    ?movID mov:hasReleaseYear ?ry.
    ?ry mov:isReleaseYear ?Year.
    ?movID mov:hasRating ?R.
    ?R mov:isRating ?Rating.
    ?movID mov:hasRunTime ?rt.
    ?rt mov:isRunTime ?RunTime.
    ?movID mov:hasVotes ?v.
    ?v mov:isVotes ?Votes.
    ?movID mov:hasSecondaryTitle ?st.
    ?st mov:isSecondaryTitle ?OriginalTitle.
  }`;
    if (!isFirst) {
      myQuery = myQuery.concat(type);
    }
    isFirst = false;
    myQuery = myQuery.concat(genreQuery);
  }
  var actorQuery = `{
    ?movID a mov:MovieID.
    ?movID mov:isMovieID ?Movieid. 
    ?movID mov:hasPrimaryTitle ?pt.
    ?pt mov:isPrimaryTitle ?Title.
    ?movID mov:hasGenre ?g.
    ?g mov:isGenre ?Genre.
    ?movID mov:isAdult ?Adult.
    ?movID mov:hasReleaseYear ?ry.
    ?ry mov:isReleaseYear ?Year.
    ?movID mov:hasRating ?R.
    ?R mov:isRating ?Rating.
    ?movID mov:hasRunTime ?rt.
    ?rt mov:isRunTime ?RunTime.
    ?movID mov:hasVotes ?v.
    ?v mov:isVotes ?Votes.
    ?movID mov:hasSecondaryTitle ?st.
    ?st mov:isSecondaryTitle ?OriginalTitle.
      ?actID a act:ActorID.
      ?actID act:hasPrimaryName "${actorName}"^^xsd:string.
      ?actID act:hasActedIn ?M.
      ?M act:hasMovieID ?mid.
      ?actID act:knownFor ?knownfor1.
      FILTER(?mid = ?Movieid).
    }`
  if (actorName) {
    if (!isFirst) {
      myQuery = myQuery.concat(type);
    }
    isFirst = false;
    myQuery = myQuery.concat(actorQuery);
  }
  var directorQuery = `{
    ?movID a mov:MovieID.
    ?movID mov:isMovieID ?Movieid. 
  ?movID mov:hasPrimaryTitle ?pt.
  ?pt mov:isPrimaryTitle ?Title.
  ?movID mov:hasGenre ?g.
  ?g mov:isGenre ?Genre.
  ?movID mov:isAdult ?Adult.
  ?movID mov:hasReleaseYear ?ry.
  ?ry mov:isReleaseYear ?Year.
  ?movID mov:hasRating ?R.
  ?R mov:isRating ?Rating.
  ?movID mov:hasRunTime ?rt.
  ?rt mov:isRunTime ?RunTime.
  ?movID mov:hasVotes ?v.
  ?v mov:isVotes ?Votes.
  ?movID mov:hasSecondaryTitle ?st.
  ?st mov:isSecondaryTitle ?OriginalTitle.
    ?dirID a dir:DirectorID.
    ?dirID dir:hasPrimaryName "${directorName}"^^xsd:string.
    ?dirID dir:hasDirected ?M.
    ?M dir:hasMovieID ?mid.
    ?dirID dir:knownFor ?knownfor2.
    FILTER(?mid = ?Movieid).
  }`
  if (directorName) {
    if (!isFirst) {
      myQuery = myQuery.concat(type);
    }
    isFirst = false;
    myQuery = myQuery.concat(directorQuery);
  }
  var producerQuery = `{
    ?movID a mov:MovieID.
  ?movID mov:isMovieID ?Movieid. 
  ?movID mov:hasPrimaryTitle ?pt.
  ?pt mov:isPrimaryTitle ?Title.
  ?movID mov:hasGenre ?g.
  ?g mov:isGenre ?Genre.
  ?movID mov:isAdult ?Adult.
  ?movID mov:hasReleaseYear ?ry.
  ?ry mov:isReleaseYear ?Year.
  ?movID mov:hasRating ?R.
  ?R mov:isRating ?Rating.
  ?movID mov:hasRunTime ?rt.
  ?rt mov:isRunTime ?RunTime.
  ?movID mov:hasVotes ?v.
  ?v mov:isVotes ?Votes.
  ?movID mov:hasSecondaryTitle ?st.
  ?st mov:isSecondaryTitle ?OriginalTitle.
    ?prodID a prod:ProducerID.
    ?prodID prod:hasPrimaryName "${producerName}"^^xsd:string.
    ?prodID prod:hasProduced ?M.
    ?M prod:hasMovieID ?mid.
    ?prodID prod:knownFor ?knownfor3.
    FILTER(?mid = ?Movieid).
  }`
  if (producerName) {
    if (!isFirst) {
      myQuery = myQuery.concat(type);
    }
    isFirst = false;
    myQuery = myQuery.concat(producerQuery);
  }
  var writerQuery = `{
    ?movID a mov:MovieID.
  ?movID mov:isMovieID ?Movieid. 
  ?movID mov:hasPrimaryTitle ?pt.
  ?pt mov:isPrimaryTitle ?Title.
  ?movID mov:hasGenre ?g.
  ?g mov:isGenre ?Genre.
  ?movID mov:isAdult ?Adult.
  ?movID mov:hasReleaseYear ?ry.
  ?ry mov:isReleaseYear ?Year.
  ?movID mov:hasRating ?R.
  ?R mov:isRating ?Rating.
  ?movID mov:hasRunTime ?rt.
  ?rt mov:isRunTime ?RunTime.
  ?movID mov:hasVotes ?v.
  ?v mov:isVotes ?Votes.
  ?movID mov:hasSecondaryTitle ?st.
  ?st mov:isSecondaryTitle ?OriginalTitle.
    ?wriID a wri:WriterID.
    ?wriID wri:hasPrimaryName "${writerName}"^^xsd:string.
    ?wriID wri:hasWritten ?M.
    ?M wri:hasMovieID ?mid.
    ?wriID wri:knownFor ?knownfor4.
    FILTER EXISTS{?wriID wri:hasWritten ?MovieID}.
  }`
  if (writerName != undefined) {
    if (!isFirst) {
      myQuery = myQuery.concat(type);
    }
    isFirst = false;
    myQuery = myQuery.concat(writerQuery);
  }
  myQuery = myQuery.concat(`} ORDER BY(?Title) LIMIT 5000`);
  var query = querystring.stringify({
    "query": `${myQuery}`
  });
  requestObject.post({ headers: { 'content-type': 'application/x-www-form-urlencoded', 'accept': 'application/json' }, url: `http://${process.env.FUSEKI}:3030/all-data/?` + query }, function (error, res, body) {
    var movieDetails = JSON.parse(body).results.bindings;
    var parsedMovieData = [];
    movieDetails.forEach(movieData => {
      parsedMovieData.push({
        title: movieData.Title.value,
        year: movieData.Year.value,
        genres: movieData.Genre.value,
        runtime: movieData.RunTime.value,
        rating: movieData.Rating.value,
        votes: parseInt(movieData.Votes.value),
        movieid: movieData.Movieid.value,
      });
    });
    parsedMovieData = parsedMovieData.sort((a, b) => a.votes < b.votes ? 1 : -1);
    response.send(parsedMovieData);
  });
});

app.get('/movie-by-rating', (request, response) => {
  const rating = request.query.rating;
  var query = querystring.stringify({
    "query": `PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX mov: <http://www.semanticweb.org/ser531-team16/movie#>
  SELECT ?Title ?Year ?MovieID ?Genre ?RunTime ?Rating ?Votes ?Adult ?OriginalTitle WHERE {
    ?movID a mov:MovieID.
    ?movID mov:isMovieID ?MovieID.
    ?movID mov:hasPrimaryTitle ?pt.
    ?pt mov:isPrimaryTitle ?Title.
    ?movID mov:hasGenre ?g.
    ?g mov:isGenre ?Genre.
    ?movID mov:isAdult ?Adult.
    ?movID mov:hasReleaseYear ?ry.
    ?ry mov:isReleaseYear ?Year.
    ?movID mov:hasRating ?R.
    ?R mov:isRating ?Rating.
    FILTER(?Rating >= "${rating}"). 
    ?movID mov:hasRunTime ?rt.
    ?rt mov:isRunTime ?RunTime.
    ?movID mov:hasVotes ?v.
    ?v mov:isVotes ?Votes.
    ?movID mov:hasSecondaryTitle ?st.
    ?st mov:isSecondaryTitle ?OriginalTitle.
  } ORDER BY DESC(xsd:integer(?Votes)) LIMIT 100`});
  requestObject.post({ headers: { 'content-type': 'application/x-www-form-urlencoded', 'accept': 'application/json' }, url: `http://${process.env.FUSEKI}:3030/movie-management/?` + query }, function (error, res, body) {
    var movieDetails = JSON.parse(body).results.bindings;
    var parsedMovieData = [];
    movieDetails.forEach(movieData => {
      parsedMovieData.push({
        title: movieData.Title.value,
        year: movieData.Year.value,
        genres: movieData.Genre.value,
        runtime: movieData.RunTime.value,
        rating: parseInt(movieData.Rating.value),
        votes: movieData.Votes.value,
        isAdult: movieData.Adult.value == 0 ? false : true,
        movieid: movieData.MovieID.value,
      });
    });
    response.send(parsedMovieData);
  });
});

app.get('/actors-by-movie', (request, response) => {
  const movieID = request.query.movieID;
  var query = querystring.stringify({
    "query": `PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX act: <http://www.semanticweb.org/ser531-team16/actor#>
    SELECT DISTINCT ?ActorID ?MovieID ?Name ?BirthYear ?knownfor ?Professions WHERE {
      ?actID a act:ActorID.
      ?actID act:hasActorID ?ActorID.
      ?actID act:hasPrimaryName ?Name.
      ?actID act:hasBirthYear ?BirthYear.
      OPTIONAL{
        ?actID act:hasDeathYear ?DeathYear.
      }
      ?actID act:hasProf ?Professions.
      ?actID act:knownFor ?knownfor.
      ?actID act:hasActedIn ?mid.
      ?mid act:hasMovieID ?MovieID.
      FILTER(?MovieID = "${movieID}"^^xsd:string).
    } ORDER BY(?Name)`});
  requestObject.post({ headers: { 'content-type': 'application/x-www-form-urlencoded', 'accept': 'application/json' }, url: `http://${process.env.FUSEKI}:3030/actor/?` + query }, function (error, res, body) {
    var actorDetails = JSON.parse(body).results.bindings;
    var parsedActorData = [];
    actorDetails.forEach(actorData => {
      parsedActorData.push({
        ActorID: actorData.ActorID.value,
        Name: actorData.Name.value,
        BirthYear: actorData.BirthYear.value,
        Professions: actorData.Professions.value,
        KnownFor: actorData.knownfor.value,
      });
    });
    response.send(parsedActorData);
  });
});

app.get('/directors-by-movie', (request, response) => {
  const movieID = request.query.movieID;
  var query = querystring.stringify({
    "query": `PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX dir: <http://www.semanticweb.org/ser531-team16/director#>
    SELECT DISTINCT ?DirectorID ?Name ?BirthYear ?knownfor ?Professions WHERE {
      ?dirID a dir:DirectorID.
      ?dirID dir:hasID ?DirectorID.
      ?dirID dir:hasPrimaryName ?Name.
      
      ?dirID dir:hasBirthYear ?BirthYear.
      OPTIONAL{
        ?dirID dir:hasDeathYear ?DeathYear.
      }
      ?dirID dir:hasProf ?Professions.
      ?dirID dir:knownFor ?knownfor.
      ?dirID dir:hasDirected ?mid.
      ?mid dir:hasMovieID ?MovieID.
      FILTER(?MovieID = "${movieID}"^^xsd:string).
    } ORDER BY(?Name)`});
  requestObject.post({ headers: { 'content-type': 'application/x-www-form-urlencoded', 'accept': 'application/json' }, url: `http://${process.env.FUSEKI}:3030/director/?` + query }, function (error, res, body) {
    var directorDetails = JSON.parse(body).results.bindings;
    var parsedDirectorData = [];
    directorDetails.forEach(directorData => {
      parsedDirectorData.push({
        DirectorID: directorData.DirectorID.value,
        Name: directorData.Name.value,
        BirthYear: directorData.BirthYear.value,
        Professions: directorData.Professions.value,
        KnownFor: directorData.knownfor.value,
      });
    });
    response.send(parsedDirectorData);
  });
});


app.get('/producers-by-movie', (request, response) => {
  const movieID = request.query.movieID;
  var query = querystring.stringify({
    "query": `PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX prod: <http://www.semanticweb.org/ser531-team16/producer#>
    SELECT DISTINCT ?ProducerID ?Name ?BirthYear ?knownfor ?Professions WHERE {
      ?prodID a prod:ProducerID.
      ?prodID prod:hasID ?ProducerID.
      ?prodID prod:hasPrimaryName ?Name.
      
      ?prodID prod:hasBirthYear ?BirthYear.
      OPTIONAL{
        ?prodID prod:hasDeathYear ?DeathYear.
      }
      ?prodID prod:hasProf ?Professions.
      ?prodID prod:knownFor ?knownfor.
      ?prodID prod:hasProduced ?mid.
      ?mid prod:hasMovieID ?MovieID.
      FILTER(?MovieID = "${movieID}"^^xsd:string).
    } ORDER BY(?Name)`});
  requestObject.post({ headers: { 'content-type': 'application/x-www-form-urlencoded', 'accept': 'application/json' }, url: `http://${process.env.FUSEKI}:3030/producer/?` + query }, function (error, res, body) {
    var producerDetails = JSON.parse(body).results.bindings;
    var parsedProducerData = [];
    producerDetails.forEach(producerData => {
      parsedProducerData.push({
        ProducerID: producerData.ProducerID.value,
        Name: producerData.Name.value,
        BirthYear: producerData.BirthYear.value,
        Professions: producerData.Professions.value,
        KnownFor: producerData.knownfor.value,
      });
    });
    response.send(parsedProducerData);
  });
});


app.get('/writers-by-movie', (request, response) => {
  const movieID = request.query.movieID;
  var query = querystring.stringify({
    "query": `PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX wri: <http://www.semanticweb.org/ser531-team16/writer#>
    SELECT DISTINCT ?WriterID ?Name ?BirthYear ?knownfor ?Professions WHERE {
      ?wriID a wri:WriterID.
      ?wriID wri:hasID ?WriterID.
      ?wriID wri:hasPrimaryName ?Name.
      ?wriID wri:hasBirthYear ?BirthYear.
      OPTIONAL{
        ?wriID wri:hasDeathYear ?DeathYear.
      }
      ?wriID wri:hasProf ?Professions.
      ?wriID wri:knownFor ?knownfor.
      ?wriID wri:hasWritten ?mid.
      ?mid wri:hasMovieID ?MovieID.
      FILTER(?MovieID = "${movieID}"^^xsd:string).
    } ORDER BY(?Name)`});
  requestObject.post({ headers: { 'content-type': 'application/x-www-form-urlencoded', 'accept': 'application/json' }, url: `http://${process.env.FUSEKI}:3030/writer/?` + query }, function (error, res, body) {
    var writerDetails = JSON.parse(body).results.bindings;
    var parsedWriterData = [];
    writerDetails.forEach(writerData => {
      parsedWriterData.push({
        WriterID: writerData.WriterID.value,
        Name: writerData.Name.value,
        BirthYear: writerData.BirthYear.value,
        Professions: writerData.Professions.value,
        KnownFor: writerData.knownfor.value,
      });
    });
    response.send(parsedWriterData);
  });
});


app.get('/reviews-by-movie', (request, response) => {
  const movieID = request.query.movieID;
  var query = querystring.stringify({
    "query": `PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX rev: <http://www.semanticweb.org/ser531-team16/review#>
    SELECT ?ReviewID ?MovieID ?Reviewer ?Rating ?Summary ?SpoilerTag WHERE {
      ?review a rev:Review.
      ?review rev:hasReviewID ?ReviewID.
      ?review rev:hasMovieID ?MovieID.
      FILTER(CONTAINS(?MovieID,"${movieID}"^^xsd:string)).
      ?review rev:hasRating ?r.
      ?r rev:hasRatingValue ?Rating.
      ?review rev:hasReviewerName ?Reviewer.
      ?review rev:hasSummary ?Summary.
      ?review rev:hasSpoilerTag ?SpoilerTag.
    } ORDER BY(?ReviewID) LIMIT 100`});
  requestObject.post({ headers: { 'content-type': 'application/x-www-form-urlencoded', 'accept': 'application/json' }, url: `http://${process.env.FUSEKI}:3030/review/?` + query }, function (error, res, body) {
    var reviewDetails = JSON.parse(body).results.bindings;
    var parsedReviewData = [];
    reviewDetails.forEach(reviewData => {
      parsedReviewData.push({
        ReviewID: reviewData.ReviewID.value,
        MovieID: reviewData.MovieID.value,
        Reviewer: reviewData.Reviewer.value,
        Rating: reviewData.Rating.value,
        Summary: reviewData.Summary.value,
        SpoilerTag: reviewData.SpoilerTag.value,
      });
    });
    response.send(parsedReviewData);
  });
});

app.post('/review', (request, response) => {
  const review = request.body.review;
  sendToQueue('review', { "review": review });
  response.send({ "message": "ok" });
});