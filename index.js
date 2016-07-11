// REQUIRE KNEX 
var knex = require('knex')({
  client: 'pg',
  connection: {
    database: 'recipes',
    user: 'ubuntu',
    password: 'thinkful'
  },
});

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var jsonParser = bodyParser.json();

// POST REQUEST - accepts json objects with name, steps, and tags
app.post('/recipes', jsonParser, function(req, res) {
  var name = req.body.name;
  var steps = req.body.steps;
  var tags = req.body.tags;
  
  // CHECKING FOR DUPLICATE RECIPE NAMES
  knex.select('name').from('recipes').where({
    name: name
  })
  // RETURNS TO 'res' WHAT QUERY FINDS
  .then(function(res) {
    // WILL ONLY RUN IF THERE ARE NO DUPLICATES
    if (res.length === 0) {
      // ADDING RECIPE NAME TO RECIPE TABLE
      knex.insert({
        name: name,
      })
      .returning('id') // RETURNS ID TO 'recipe_id' BELOW
      .into('recipes') 
      .then(function(recipe_id) { // NESTED TO PREVENT ASYNC
      
        // ITERATES THROUGH STEPS AND ADDS TO STEPS TABLE
        for (var i = 0; i < steps.length; i++) {
          // ADDS STEPS TO TABLE
          knex.insert({
            instruction: steps[i],
            step_num: i + 1,
            recipe_id: recipe_id[0]
          }).into('steps').then();
        }
        
        // ITERATES THROUGH TAGS AND RUNS TESTS
        for (var j = 0; j < tags.length; j++) {
          
          // SNAPSHOT OF ASYNC KNEX METHODS
          // CLOSURE WILL BE CALLED AT THE END TO ENSURE SYNCHRONOUS CODE
          // each iteration of for loop will run the function 1 time
          (function(tagname) { // tagname = tags[j] (passed in later)
          
            // CHECKS FOR DUPLICATE TAGS 
            knex.select('tag', 'id').from('tags').where({
              tag: tagname
            })
            .then(function(res) {
              // IF TAG DOES NOT EXIST IT WILL ADD THE TAG
              if (res.length === 0) {
                // ADDS TAG TO TAGS TABLE
                knex.insert({ 
                  tag: tagname
                })
                .into('tags')
                .returning('id') // RETURNS ID TO 'tag_id'
                .then(function(tag_id) {
                  // ADDS LINK IN RECIPES_TAGS TABLE
                  knex.insert({
                    recipe_id: recipe_id[0],
                    tag_id: tag_id[0]
                  }).into('recipes_tags').then();
                });
              } 
              // OTHERWISE SKIPS ADDING TAGS AND ONLY CREATES LINK
              else {
                knex.insert({
                  recipe_id: recipe_id[0],
                  tag_id: res[0].id
                }).into('recipes_tags').then();
              }
            });
          })(tags[j]); // CALLS THE SNAPSHOT FUNCTION
        }
        return res.status(201).json({});
      });
    } else {
      res.sendStatus(400);
    }
  });
});

app.listen(process.env.PORT);