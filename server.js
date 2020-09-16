import express from "express";
import {ApolloServer, AuthenticationError, gql} from "apollo-server-express";
import faker from "faker";
import times from "lodash.times";
import random from "lodash.random";
import typeDefs from "./schema";
import resolvers from "./resolvers";
import db from "./models";

const server = new ApolloServer({
  typeDefs: gql(typeDefs),
  resolvers,
  context: ({req}) => {
    const {headers} = req;
    const {accessToken} = headers;

    if (!accessToken && false) {
      throw new AuthenticationError("token does not exists");
    }

    return {db};
  },
  formatError: (err) => {
    return {
      statusCode: 500,
      error: err.message,
      message: "Graphql Error"
    }
  },
  formatResponse: (response) => {
    response['statusCode'] = 200;
    response['message'] = "Success Response";
    return {
      statusCode: 200,
      data: response ? response.data : null,
    }
  },
});

const app = express();
server.applyMiddleware({app});

app.use(express.static("app/public"));

db.sequelize.sync().then(() => {
  // populate author table with dummy data
  db.author.bulkCreate(
    times(10, () => ({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName()
    }))
  );
  // populate post table with dummy data
  db.post.bulkCreate(
    times(10, () => ({
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
      authorId: random(1, 10)
    }))
  );

  app.listen({port: 4000}, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
});
