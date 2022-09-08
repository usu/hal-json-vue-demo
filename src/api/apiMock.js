const timeoutDurationInMs = 1000;

// catalog of mock responses (already flattened as for example provided by hal-json-normalizer)
const apiMockResponses = {};

apiMockResponses["/entities/2"] = {
  "/entities/2": {
    property1: "c",
    property2: "d",
    _links: {
      self: "/entities/2",
      children: ["/entities/1"],
      nonEmbeddedRelation: "/entities/3",
    },
  },
};

apiMockResponses["/entities/1"] = {
  "/entities/1": {
    property1: "a",
    property2: "b",
    _links: {
      self: "/entities/1",
      parent: "/entities/2",
    },
  },

  // embedded parent
  "/entities/2": apiMockResponses["/entities/2"]["/entities/2"],
};

apiMockResponses["/entities/3"] = {
  "/entities/3": {
    property1: "1",
    property2: "2",
    _links: {
      self: "/entities/3",
    },
  },
};

apiMockResponses["/entities"] = {
  "/entities": {
    count: 3,
    _links: {
      self: "/entities",
      items: ["/entities/1", "/entities/2", "/entities/3"],
    },
  },
};

apiMockResponses["/api_call_with_sideeffect"] = {
  "/api_call_with_sideeffect": {},
  "/entities/1": {
    property1: "???????????????????????????",
    property2: "!!!!!!!!!!!!!!!!!!!!!!!!!!!",
    _links: {
      self: "/entities/1",
      parent: "/entities/3",
    },
  },
};

export function fetch(uri) {
  console.log(`fetch from network: ${uri}`);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (uri in apiMockResponses) {
        resolve(apiMockResponses[uri]);
      }

      reject({ response: { status: 404 } });
    }, timeoutDurationInMs);
  });
}
