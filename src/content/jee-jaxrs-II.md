---
layout: post
title: "Exploring RESTFul application with JAX-RS"
image: img/testimg-cover.jpg
author: Ghost
date: 2018-05-19T08:03:47.149Z
tags: 
  - JEE
  - "Java EE"
  - "EX183"
  - "Red Hat"
---

This article is a practical part of the Beginner Java EE developer (corresponding to Red Hat’s
EX183) series. For theoretical background, refer to: 

* [[REST services with JAX-RS] Enter the RESTFul world](/jee-jaxrs-I).

You can download the application described here at [halfastack.com/JAX\_RS\_1](https://github.com/m-czernek/halfastack.com/tree/master/JAX_RS_1).

![Example of JAX-RS application interface](https://raw.githubusercontent.com/m-czernek/halfastack.com/master/JAX_RS_1/imgs/rest_example.png)

# Prerequisites

* A running Wildfly server
* Maven
* REST client

If this is your first entry into the JavaEE world, check out How to get started.

As a REST client, I use the [Advanced REST client](https://install.advancedrestclient.com/install). You can use cURL from command line, or any other client you feel comfortable with.

# Deployment

To deploy the application:

1. Download my github repository. If you have git installed, issue git clone https://github.com/m-czernek/halfastack.com.git Otherwise, download and unzip it manually.
2. Change into the project directory:
  1. On Unix, issue: `cd halfastack.com/JAX_RS_1/`.
  2. On Windows, issue: `cd halfastack.com\JAX_RS_1`.
3. Build the project with Maven: `mvn clean package`.
4. Copy the war archive into the deployments directory of your Wildfly server. In the following steps, _SERVER_HOME_ is the directory where your Wildfly server is:
  1. On Unix, issue: cp target/JAX_RS_1.war SERVER_HOME/standalone/deployments
  2. On Windows, issue: copy target\JAX_RS_1.war SERVER_HOME\standalone\deployments

If successful, you should see something similar in the console log of Wildfly:

```bash
20:59:19,404 INFO  [javax.enterprise.resource.webcontainer.jsf.config] (ServerService Thread Pool -- 76) Initializing Mojarra 2.3.9.SP02 for context '/JAX_RS_1'
20:59:20,057 INFO  [org.jboss.resteasy.resteasy_jaxrs.i18n] (ServerService Thread Pool -- 76) RESTEASY002225: Deploying javax.ws.rs.core.Application: class com.halfastack.rest.JaxRsActivator
20:59:20,113 INFO  [org.wildfly.extension.undertow] (ServerService Thread Pool -- 76) WFLYUT0021: Registered web context: '/JAX_RS_1' for server 'default-server'
20:59:20,195 INFO  [org.jboss.as.server] (ServerService Thread Pool -- 44) WFLYSRV0010: Deployed "JAX_RS_1.war" (runtime-name : "JAX_RS_1.war")
```

At this point, you can issue a simple GET request at `server:port/JAX_RS_1/api/authors/getAuthors`, for example:

`http://localhost:8080/JAX_RS_1/api/authors/getAuthors`

That will return an array of all the authors available in our application:

```json
["Mariko Koike","Kazuo Ishiguro","Amy Chua","Graham Greene"]
```

Note that to make a GET request, you can also enter the url into your browser.

# Exploring the source code 
## Examining the path

We already made a request. Let’s break it down:

* **localhost**: URL of the server; Depends on where your server is running.
* **8080**: Port of the server; Depends on the server settings.
* **/JAX\_RS\_1**: Depends on the context that you give to your app. If no context is given, by default, the .war name is taken.
* **/api**: This is set in the [JaxRsActivator](https://github.com/m-czernek/halfastack.com/blob/master/JAX_RS_1/src/main/java/com/halfastack/rest/JaxRsActivator.java) class, using the `@ApplicationPath("api")` annotation. The class:
  * Extends `javax.ws.rs.core.Application` to activate the Resteasy REST implementation in your app.
  * Declares path shared for the whole project. All your endpoints will share the `/api` path in our example.
* **/authors**: This part of path is shared for the [AuthorEntityRestService](https://github.com/m-czernek/halfastack.com/blob/master/JAX_RS_1/src/main/java/com/halfastack/rest/AuthorEntityRestService.java) class. 
* **/getAuthors**: This is finally the endpoint for a particular method exposed in the [AuthorEntityRestService](https://github.com/m-czernek/halfastack.com/blob/master/JAX_RS_1/src/main/java/com/halfastack/rest/AuthorEntityRestService.java#L26) class.

## Exploring annotations

The **AuthorEntityRestService** class is annotated with the following annotations:

```java
@Path("/authors")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Stateless
public class AuthorEntityRestService {
```

We see that `@Produces` and `@Consumes` is at the class level. That means all methods within this class:

* Produce JSON responses, as you can see in your call to `getAuthors`
* Expect that all inquiries requiring any payload, such as an `Author` entity, use the JSON format

I included the `@Stateless` annotation because we deal with Hibernate and I wanted to let the container, i.e. Wildfly, to take care of the transactions for us.

Within the code, there are a couple of further interesting annotations:

### HTTP verb annotations

HTTP verb annotations, such as `@GET`, `@POST`, `@PUT`, or `@DELETE`, which mark what type of a call the particular method accepts.

### Path parameter annotations

In a REST application, `@PathParam` is probably the most common way of passing a parameter to your call. To successfully use a path parameter:

1. Name a parameter in your path
2. Tie the parameter in your path to a method parameter

For example:

```java
@DELETE
@Path("/deleteAuthor/{id:[0-9+]}")
public void deleteAuthor(@PathParam("id") long id) {
  // omitted for brevity
}
```

1. In our path, we refer to a parameter using curly braces: `{id:[0-9+]}`.
2. In the method argument list, we tie the `{id}` parameter using the `@PathParam("id")` to the parameter long id.

We give this parameter name `{id}` and then further restrict that this parameter has to be a numeral value, i.e. the value must be in the range of `[0-9]` unlimited in the number of digits. That is a simple regular expression you can employ to validate your path params.

Consequently, when you make a call to this method, you have to provide the ID in your path, for example:

`localhost:8080/JAX_RS_1/api/authors/deleteAuthor/1`

This call deletes the **Author** entity with ID equal to 1.

### Using query parameters

Query parameters require only annotation at the level of method parameters, for example:

```java
@GET
@Path("/getAuthorByName")
public List<Author> getAuthorByName(@DefaultValue("") @QueryParam("firstName") String firstName, 
    @DefaultValue("") @QueryParam("secondName") String secondName) {
      // omitted for brevity
}
```

In such case, our application is expecting query parameters, first one separated by a question mark **?** and subsequent ones separated by an ampersand **&**. For example:

`http://localhost:8080/JAX_RS_1/api/authors/getAuthorByName?firstName=Kazuo&secondName=Ishiguro`

In our case, that returns:

```json
[{"id":2,"firstName":"Kazuo","surname":"Ishiguro","books":[{"id":2,"title":"The Buried Giant","available":true}]}]
```

In case you do not provide any value, the `@DefaultValue` value is used.

### Using payload to pass a method parameter

Consider the following method:

```java
@POST
@Path("/createAuthor")
public void createAuthor(Author author) {
		em.persist(author);
}
```

How do you pass the Author entity to the method? With no annotation, your application will expect a payload, in our case a JSON payload in the POST request.

Our **Author** entity contains the following fields:

1. firstName
2. surname
3. ID (automatically generated, we can exclude this one)

As such, we would pass something like:

```json
{
"firstName":"Rob",
"surname":"Brown"
}
```

If successful, return value is **204**. 


# Exploring the unit test code

Because EX183 recommends you learn how to consume REST endpoints from your app, I also provided a simple unit test class. However, a caveat:

* Unit tests for Java EE applications are quite difficult if you aren’t using something like Shrinkwrap and Arquillian. If the tests are failing because you deleted or altered an Author entity, re-deploy your application, which will restore default database.

In fact, I would recommend you re-deploy the app before running JUnit tests. If we were to use Arquillian, we could redeploy before every test. These unit tests are rather a showcase of how our application should work and how to use the Resteasy Client API.

I personally found the Resteasy Client API quite clunky. I realized that Java EE applications often do not consume REST endpoints; it is most likely other language, such as PHP or JavaScript, that consumes your endpoints.

You can find the JUnit test code in the [com.halfastack.tests.AuthorRestTests](https://github.com/m-czernek/halfastack.com/blob/master/JAX_RS_1/src/test/java/com/halfastack/tests/AuthorRestTests.java) class. I will not go into detail on the client code as I do not consider it important from the perspective of the EX183; however, since it is mandated by the requirements in the exam, I am providing it nevertheless.

# Learn by doing
To truly learn the subject matter, you should enhance the application’s functionality. For this project, create a Rest-enabled class for the **Book** entity such that it enables you to:
* List all books in the database (just name of the book) List all books and their author
* Delete a Book entity
* Associate a Book entity with an Author entity

The calls should be in the following path: `.../JAX_RS_1/api/books/...` For example: `localhost:8080/JAX_RS_1/api/books/getAllBooks`.

The calls should accept and produce JSON.

# Summary

You now understand basics of REST application. You should know:
1. How to enable your application for REST endpoints.
2. How to set REST path for your application, all methods in one class, and an individual method.
3. How to pass a parameter to your method.
4. How to pass an entity to your method.
