import { expect, test, describe, afterAll } from "vitest";
import fetch from "isomorphic-fetch";
import canisterIds from "./canister_ids.json";
const helloCanisterId = canisterIds.test.ic;

console.log(`canisterId: ${helloCanisterId}`);

const express = require("express");
const app = express();

app.get(`/hi`, (req, res) => {
  res.send(`hi`);
});

app.get(`/json`, (req, res) => {
  res.json({ hello: `world` });
});

app.get(`/404`, (req, res) => {
  res.status(404).send(`Not found`);
});

app.get(`/`, (req, res) => {
  res.send(`<html><body><h1>hello world</h1></body></html>`);
});

app.get(`/queryParams`, (req, res) => {
  res.json(req.query);
});

const server = app.listen(4999);

const awaitJson = async (url, options) => {
  const response = await fetch(url, options);
  const json = await response.text();
  return json;
};

const awaitText = async (url, options) => {
  const response = await fetch(url, options);
  const text = await response.text();
  return text;
};

test(`should handle a basic greeting`, async () => {
  const text = await awaitText(`http://${helloCanisterId}.icp0.io/hi`);

  expect(text).toBe(`hi`);
});

test(`should serve html`, async () => {
  const text = await awaitText(`http://${helloCanisterId}.icp0.io/`);
  expect(text).toMatchSnapshot();
});

describe(`headers`, () => {
  test(`plaintext`, async () => {
    const response = await fetch(`http://${helloCanisterId}.icp0.io/hi`);
    expect(response.headers.get(`content-type`)).toBe(`text/plain`);
  });

  test.skip(`json`, async () => {
    const response = await fetch(`http://${helloCanisterId}.icp0.io/json`);
    expect(response.headers.get(`content-type`)).toBe(`application/json`);
  });

  test(`html`, async () => {
    const response = await fetch(`http://${helloCanisterId}.icp0.io/`);
    expect(response.headers.get(`content-type`)).toBe(`text/html`);
  });

  test.skip(`404`, async () => {
    const response = await fetch(`http://${helloCanisterId}.icp0.io/404`);
    expect(response.headers.get(`content-type`)).toBe(`text/plain`);

    const text = await response.text();
    expect(text).toBe(`404`);

    expect(response.status).toBe(404);
  });
});

describe(`compare with express`, () => {
  test(`should handle a basic greeting`, async () => {
    const text = await awaitText(`http://127.0.0.1:4999/hi`);
    const canisterText = await awaitText(
      `http://${helloCanisterId}.icp0.io/hi`
    );
    expect(text).toBe(canisterText);
  });

  test(`should serve json`, async () => {
    const json = await awaitJson(`http://127.0.0.1:4999/json`);
    const canisterJson = await awaitJson(
      `http://${helloCanisterId}.icp0.io/json`
    );
    expect(json).toEqual(canisterJson);
  });

  test(`should serve html`, async () => {
    const text = await awaitText(`http://127.0.0.1:4999/`);
    const canisterText = await awaitText(`http://${helloCanisterId}.icp0.io/`);
    expect(text).toBe(canisterText);
  });

  test(`should serve 404`, async () => {
    const response = await fetch(`http://127.0.0.1:4999/404`);
    const canisterResponse = await fetch(
      `http://${helloCanisterId}.icp0.io/404`
    );

    expect(response.status).toBe(canisterResponse.status);
    expect(response.statusText).toBe(canisterResponse.statusText);
    expect(await response.text()).toBe(await canisterResponse.text());
  });

  test.only(`should handle query params`, async () => {
    const json = await awaitJson(`http://127.0.0.1:4999/queryParams?foo=bar`);
    const canisterJson = await awaitJson(
      `http://${helloCanisterId}.icp0.io/queryParams?foo=bar`
    );
    expect(json).toEqual(canisterJson);

    const json2 = await awaitJson(
      `http://127.0.0.1:4999/queryParams?foo=bar&baz=qux`
    );
    const canisterJson2 = await awaitJson(
      `https://${helloCanisterId}.icp0.io/queryParams?foo=bar&baz=qux`
    );
    expect(json2).toEqual(canisterJson2);
  });
});

afterAll(() => {
  server.close();
});
