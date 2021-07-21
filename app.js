const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
var { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Event = require('./models/event');
const User = require('./models/user');

const app = express();

app.use(bodyParser.json());

app.use(
    '/graphql', 
    graphqlHTTP({
schema: buildSchema(`
type Event {
    _id: ID!
    title: String!
    desc: String!
    price: Float!
    date: String!
}
type User {
    _id: ID!
    email: String!
    password: String
}

input EventInput {
    title: String!
    desc: String!
    price: Float!
    date: String!
}

input UserInput {
    email: String!
    password: String!
}
type RootQuery{
  events: [Event!]!
}
type RootMutation{
createEvent(eventInput: EventInput): Event
createUser(userInput: UserInput): User
}
schema {
    query: RootQuery
    mutation: RootMutation
}
`),
rootValue: {
    events: () => {
    return Event.find()
    .then( events => {
    return events.map(event =>{
     return{ ...event._doc, _id: event._doc._id.toString() };
    });
    }).catch( err => {
    throw err;
    });
    
    },
    createEvent: (args) => {
      const event = new Event({
            title: args.eventInput.title,
            desc: args.eventInput.desc,
            price: +args.eventInput.price,
            date: new Date(args.eventInput.date)
      });
       return event
       .save().then( result => {
          console.log(result);
          return { ...result._doc };
       })
       .catch( err => {
           console.log(err);
           throw err;
       });
        return event;
},
createUser: args => {
    return bcrypt
    .hash(args.userInput.password, 12)
         .then( hashedPassword => {
            const user = new User({
                email: args.userInput.email,
                password: hashedPassword
             });
             return user.save();
         })
         .then( result => {
             return { ...result._doc, _id: result.id };
         })
         .catch( err => {
           throw err;
         });
}
},
graphiql: true
}));

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.ko8nz.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`)
.then((data) => {
    app.listen(3000);
})
.catch(err => {
    console.log(err);
});
