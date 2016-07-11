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
        knex.insert({
          name: name,
        }).returning('id').into('recipes').then(function(recipe_id) {
        
          for (var i = 0; i < steps.length; i++) {
            knex.insert({
              instruction: steps[i],
              step_num: i + 1,
              recipe_id: recipe_id[0]
            }).into('steps').then();
          }
          
          for (var j = 0; j < tags.length; j++) {
            (function(tagname) {
              knex.select('tag', 'id').from('tags').where({
                tag: tagname
              }).then(function(res) {
                if (res.length === 0) {
                  knex.insert({
                    tag: tagname
                  }).into('tags').returning('id').then(function(tag_id) {
                    knex.insert({
                      recipe_id: recipe_id[0],
                      tag_id: tag_id[0]
                    }).into('recipes_tags').then();
                  });
                } else {
                  knex.insert({
                    recipe_id: recipe_id[0],
                    tag_id: res[0].id
                  }).into('recipes_tags').then();
                }
              });
            })(tags[j]);
          }
      });
    }
  });
  

  
  // console.log('all done');
  res.status(201).json({
    this: 'worked'
  });
});

app.listen(process.env.PORT);