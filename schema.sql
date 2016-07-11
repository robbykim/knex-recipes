drop table recipes cascade;
drop table tags cascade;
drop table recipes_tags cascade;
drop table steps cascade;

create table if not exists recipes (
    id serial primary key, 
    name text not null unique
);

create table if not exists tags (
    id serial primary key,
    tag text not null unique
);

create table if not exists recipes_tags (
    recipe_id integer references recipes,
    tag_id integer references tags,
    primary key (recipe_id, tag_id)
);

create table if not exists steps (
    id serial primary key, 
    instruction text not null,
    step_num integer not null,
    recipe_id integer references recipes
);