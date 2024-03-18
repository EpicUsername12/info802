import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

const client = new ApolloClient({
    uri: "https://api.chargetrip.io/graphql",
    cache: new InMemoryCache(),
    headers: {
        "x-client-id": "65f724831a8772e7fb10e79b",
        "x-app-id": "65f724831a8772e7fb10e79d",
    },
});

export default client;
