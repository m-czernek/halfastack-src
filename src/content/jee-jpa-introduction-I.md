---
layout: post
title: "Java EE JPA Introduction I"
image: img/article-background.png
author: Marek
date: 2018-04-06T07:03:47.149Z
tags: 
  - JEE
  - "Java EE"
  - "EX183"
  - "Red Hat"
---

This article of the JEE series focuses on the _Java Persistence API_ (JPA) specification. As per the convenient Red Hat’s EX183 requirements, a JEE developer should know the following about JPA:

* Understand the problem that JPA solves
* Understand and be able to implement the basics of JPA bidirectional mapping 
* Understand and be able to leverage JEE’s bean validation
* Utilise JPA queries and fetching behavior

The following article focuses on the first two points.

# What does JPA solve?

Imagine you’re creating your large enterprise application. Whether it is an application for a store, a service, a bank, or anything else, you probably need to save and retrieve some kind of data for your application to work correctly. For example, what items are on stock? What is the range of items you’re selling? Who is your customer and what is the password they entered when they registered? All of this data has to be:

1. Concurrent
2. Transactional
3. Mapped to objects

The data has to be ***concurrent*** because typically, thousands of clients will be accessing and possibly trying to write to your data at once. ***Transactionality*** then ensures that if one operation fails (for example, an error during payment), every operation in the transaction will fail as well (for example, the item does not get sent) and does not get written into the database. Additionally, since Java is an object-oriented language, it is safe to assume that when you work with your data, you’d want to map the data to Java objects to make the job simpler. This is called Object Relational Mapping (ORM) and is the de facto standard way to handle your database data in JEE applications.

JPA is an API based on a specification that deals with all of the problems above. It has no default implementation. That’s why you will use one of the JPA providers, such as Hibernate, EclipseLink, or others. In the practical part of this introduction, I decided to use the *HyperSQL DataBase* (HSQL DB) database with *Hibernate* as the JPA provider. I chose the HSQL DB because of the ease of setting your own database server (while keeping all the necessary typical steps, such as deploying your database driver), and Hibernate because it seems to be the most popular implementation of JPA. Additionally, Hibernate is provided by the Wildfly server.

# JPA relational mapping

In order to map your data to Java objects, JPA requires you to create entity objects. An entity object is a regular Java object with a dedicated annotations. When you mark an object to be an entity, JPA provider then knows to store and retrieve this object into and from the database. For example, this is a familiar POJO:

```java
public class Customer {
    private String firstName;
    private String surname;
    private String address;
// getters and setters
}
```

To make it into a JPA-managed entity bean, do the following:

1. Annotate the POJO as an Entity, and specify the database table is uses
2. Create an ID field and annotate it as such
3. Choose ID generation strategy
4. Map any fields that have a relation with a different table in the same database

In our example above, step #4 does not apply because no field of our example Customer class contains any other class we created. However, we can apply steps 1-3:

```java
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

   @Entity
   @Table(name="Customers")
   public class Customer {
   @Id
   @GeneratedValue(strategy=GenerationType.AUTO)
   private long id;
   private String firstName;
   private String surname;
   private String address;
   
   // Getters and setters omitted for brevity
}
```

In the example above, we specify the following:

1. *@Entity* on line 7 specifies this is a JPA entity
2. *@Table* on line 8 specifies the table which will be mapped by this entity. This is necessary in case the class name is different from the table name it maps.
3. *@Id* on line 10 is a primary key (PK) in the database
4. *@GeneratedValue* on line 11 specifies how will the PK be generated. `GenerationType.AUTO` then lets the database decide on the algorithm for generating PKs.

With the Entity bean, we see that:

* A class maps a table in the database 
* An instance of the class maps one row

# JPA bidirectional mapping

The example above does not refer any other entity; often, however, you have multiple tables that have some kind of a relationship between each other. With JPA, you utilize one of the following relationships:

* ***One-to-One***: an object is mapped to precisely one other object 
* ***One-to-Many***: an object is mapped to a number of other objects 
* ***Many-to-One***: many objects of this type map to one other object 
* ***Many-to-Many***: many objects of this type map to many other objects

Consider the following example entities:

```java
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToOne;
import javax.persistence.Table;

@Entity
@Table(name="EmployeeTable")
public class Employee {

    @Id
    @GeneratedValue(strategy=GenerationType.AUTO)
    private long id;

    @OneToOne
    @JoinColumn(name="addressId")
    private Address address;

    @ManyToOne
    @JoinColumn(name="employerId")
    private Employer employer;
    // Getters and setters omitted for brevity
}
     
import java.util.List; 
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.OneToMany;
import javax.persistence.Table;

@Entity
@Table(name="EmployerTable")
public class Employer {

    @Id
    @GeneratedValue(strategy=GenerationType.AUTO)
    private long id;

    @OneToMany(mappedBy="employer")
    Lists<Employee> employees;
}
```

All relationships are mapped from the perspective of the currently mapped class. That means:

* Employee has a one-to-one relationship with the Address entity. In other words, there is one Employee per one Address. Both classes will have the *@OneToOne* annotation.
* Many Employee entities have one Employer entity. That means in the Employee class, there will be the *@ManyToOne* annotation and in the Employer class, there will be the *@OneToMany* annotation. That is because there is one Employer per many employees.

All of the relationships must contain one of the following:
* *@JoinColumn*: this annotation relates to the SQL table, and is used for the SQL join. In our case, the Employee table must have a SQL field addressId and employerId, which act as a foreign key for the respective Address and Employer tables. 
* *mappedBy="field_name"*: This is an optional element, which relates to another entity, not a table. In our case, `mappedBy="employer"` means that this field has been mapped by an employer field. This field is in class Employee. As such, this attribute maps to another entity.

The last relationship, *@ManyToMany*, is distinctive because it needs a cross-join table to function. For example, if we take our previous Employee and Employer, and map it such that an Employee can have many Employers and vice versa, that means using the ManyToMany relationship, we would have to have three SQL tables: Employee, Employer, and the cross-join one (typically _Entity1XEntity2_, so in our case, EmployeeXEmployer).

```SQL
CREATE TABLE Employee (
  "id" LONG not null primary key,
  /* Further fields that you need to store */
);

CREATE TABLE Employer (
  "id" LONG not null primary key,
  /* Further fields that you need to store */
);

/* This table contains only references. */
CREATE TABLE EmployeeXEmployer (
  "id" LONG not null primary key,
  "employeeId" LONG not null,
  "EmployerId" LONG not null,
  FOREIGN KEY ("employeeId") REFERENCES Employee("id"),
  FOREIGN KEY ("employerId") REFERENCES Employee("employerId")
);
```

The class that maps the relationship then uses the @JoinTable annotation:

```java
// For class Employee
@JoinTable(name="EmployeeXEmployer",
    joinColumns=@JoinColumn(name="employeeId"), // this is the SQL Field that maps to this class
    inverseJoinColumns=@JoinColumn(name="employerId")) // This is the SQL Field that maps Employer to this class
private List<Employer> employers;
```

The other class then, again, references only the Entity field that maps this class. Note that the following reference, again, has nothing to do with SQL. It refers to the class field that is mapping this relationship. 

```java
// For the Employer class
@ManyToMany(mappedBy="employers") 3 List<Employee> employees
```

# Summary
This article has been a part I of our theoretical introduction to JPA. By now, you should be able to describe:

* Problems that JPA solves
* Difference between JPA and Hibernate or EclipseLink
* Describe at least three JPA annotations used for JEE applications Describe bidirectional mapping

In the second part, Java EE JPA Introduction II, we will focus on fetching behavior, validation, and setting up your environment for the practical part of JPA.
