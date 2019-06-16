---
layout: post
title: "Java EE JPA Introduction II"
image: img/article-background.png
author: Marek
date: 2018-04-14T07:03:47.149Z
tags: 
  - JEE
  - "Java EE"
  - "EX183"
  - "Red Hat"
---

This is a part II of our JPA introduction series. See the Java EE JPA Introduction I article if you
haven’t already. The following article focuses on:

* Understanding JEE’s bean validation 
* JPA queries and fetching

# Bean Validation

JEE defines a number of validation annotations that you can use to ensure correctness of user input and thus the sanity of the database. Generally, in POJO, developers may be used to something like this:

```java
public void setName(String name) {
  if(name != null) {
    this.name = name;
  } else {
    // handle the case
  }
}
```

In Java EE, you can avoid this with a simple field annotation:

```java
@Entity
public class Book {
  @NotNull
  private String name;
  // rest of the class is omitted
}
```

There are a number of useful annotations, all of which you will find in the `javax.validation.constraints` package. A couple of very useful ones are:

* _@NotNull_: A field cannot be null.
* _@Size(min=X, max=Y)_: Enforces a String to be between given values, where X and Y are integers.
* _@Future_: Enforces date to be in the future. 
* _@Past_: Enforces date to be in the past.
* _@Digits(integer=X, fraction=Y)_: Enforces a field to have at most X numbers and at most Y decimal places.

You can pass a message that is displayed if a user violates your restrictions:

* `@NotNull(message="Name cannot be null")`: Prints “Name cannot be null” when the user forgets to input a name.

# Managing entities

So far, we spoke about entity beans and mapping them to each other. However, often times, you will want to execute queries on your database, save an object into a database, or delete an object from the database.

For example, you might want to find all Employee entity beans who work in a given department. Or you may want to find all Customer entity beans who spent more than 1000$ over the last week. For that, we use JPA queries.

To work with JPA queries, use the EntityManager object. You can inject the EntityManager object, or construct using the EntityManagerFactory object if you manage your datasource manually. EntityManager enables you, among other functions, to:

* Perform CRUD operation against your database, for example updating or deleting an entity
* Create Query, NamedQuery, TypedQuery, and many other query objects.

# Configuration necessary for EntityManager

To get an entity manager, first declare your persistence unit. This consists of two parts:

1. Create a datasource in your application server:
    1. Define a URL connection to your database
    2. Define username and password
    3. Define a JNDI name
    
    A _Java Naming Directory Interface_ (JNDI) name is simply an ID that enables your application to discover your database and access it using the predefined settings, so that you do not have to expose underlying username, password, and URL in your application. Rather, it is safely stored on the server.
2. Define the datasource in _persistence.xml_. Persistence.xml is a configuration file stored in the resources directory (e.g. `src/main/resources/META-INF/persistence.xml`). See the [persistence.xml](https://github.com/m-czernek/halfastack.com/blob/master/JPA_1/src/main/resources/META-INF/persistence.xml) used for our example application. It needs to specify:
    1. The _jta-data-source_ tag that points to the JNDI set up within the application server.
    2. The hibernate dialect (every database may have slightly different SQL that it accepts, i.e. its own SQL dialects)
    3. In our case, also scripts that get run so that when our app is deployed, the database will have some data. This is very useful for testing and development.

In the example _persistence.xml_ file, I use JTA datasource, which means it’s container-managed.

Note that in persistence.xml, you could also define the whole datasource, that is enter the URL, username, and password of the database. This, however, is not recommended. In the following article, I will document creating a database connection and defining it in the Wildfly application server.

## Instantiating EntityManager

After the necessary configuration, you will be able to inject your EntityManager object:

```java
@PersistenceContext
EntityManager em;
```

In our persistence.xml, we defined a name for our persistence unit:

```xml
<persistence-unit name="BookDB" transaction-type="JTA">
```

This is because you could define a number of persistence units (one for development, one for stage, for example). If you have more than one persistence units declared in your app, use the unitName attribute to specify which one you want to instantiate:

```java
@PersistenceContext(unitName="BookDB") 
EntityManager em;
```

## Managing entities with EntityManager without JPA Queries

Use the EntityManager object for your basic CRUD (create-read-update-delete) operations:

* Create: `em.persist(entityInstance);`
* Read: `em.find(entityClass, primaryKey);` 
* Update: `em.merge(entityInstance);` 
* Delete: `em.remove(entityInstance);`

So, for example, if you know the primary key of an object, you could do something like:

```java
public Book getBookByPK(long pk) { 
  return em.find(Book.class, pk); 
}
```

Supposing that the *Book* class has the following attributes:

* ID 
* author 
* title

`em.find(Book.class, pk)` translates to something like:

`SELECT b.id, b.author, b.title FROM Books b WHERE b.id = pk`

In case the Book entity has custom entities as fields, the query would grow in complexity. JPA solves this complexity for you.

## Managing entities with EntityManager with JPA Queries

To execute custom queries against your databases, JPA provides JPA Queries. To create them, we use the EntityManager object as well. The following is an example of a TypedQuery, which uses a class to type the resulting object(s):

```java
import javax.persistence.TypedQuery;
...

public List<Book> findByAuthor(String name) {
  TypedQuery<Book> query = em.createQuery("SELECT b FROM Book b WHERE b.author =?1");
  query.setParameter(1, name.toLowerCase());
  return query.getResultList();
}
```

With JPA queries, you most often want to parametrize your SQL statements. As such, there are two main ways to pass parameters to a JPA query:

1. By position: marked by *?{positionNumber}* in the SQL query 
2. By name: marked by *:{parameterName}* in the SQL query

For example:

1. ... *WHERE b.author =?10* is referenced by `query.setParameter(10, myVariable);`
2. ... *WHERE b.author =:authorName* is referenced by `query.setParameter("authorName", myVariable);`

You may use as many parameters as necessary in one JPA query.

# Fetching behavior

Fetching means the process for getting data from your database when you instantiate an entity. Consider the following example:

```java
@Entity
@Table(name="LIBRARY")
public class Book {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    
    // Relational mapping omitted for brevity
    private Author author;
    private Title title;
    private Availability available;
    private Price price;
    private List<Customer> lentTo;
    private List<Customer> waitingList;
    
   // Rest of the class omitted for brevity
}
```

When you instantiate this class with EntityManager, JPA may look into the database for each of the fields of your class. This can introduce a significant performance hit, especially when you know you are not likely to need a piece of data in the specific context.

For example, you are displaying a book to the potential lender. Since that view has no access to the list of people who have lent this book, nor if there is a particular waiting list, it makes sense not to get those data from database. And that’s what the fetching strategy enables you to do.

JPA enables you to customise what is fetched at what time. The two basic fetch strategies are:

* Eager fetching: load this piece of data during instantiation
* Lazy fetching: load this piece of data when an application accesses it

These strategies can be broken down to allow for much greater control over what piece of data gets looked up in the database at what time. A very basic example of setting fetching looks as follows:

```java
@Entity
@Table(name="LIBRARY")
public class Book {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="authorId")
    private Author author;
}
```

Note that you can also set fetching for only individual queries. For example, the following query eagerly loads the author field even if you specified that the fetch type should be lazy:

`em.createQuery("SELECT b FROM Book b JOIN FETCH b.author" , Book.class);`

Fetching is a deep topic, though because EX183 is an introductory course, we will not cover it in more depth.

# Summary

This article has been a part II of our theoretical introduction to JPA. By now, you should be able to describe:

* How to validate JPA beans
* How to perform CRUD operations on entities
* How to perform statements on your database to get entities
* What is fetching
* How do you set fetching on a field and later override it in a query.

The next part will cover a practical example of a JPA application, as well as description of the database and server setup. Next stop: the JPA setup guide.
