---
layout: post
title: "Java EE EJB Beans I: Introduction"
image: img/article-background.png
author: Marek
date: 2018-03-23T07:03:47.149Z
tags: 
  - JEE
  - "Java EE"
  - "EX183"
  - "Red Hat"
---

# The scope of this series

The EJB articles will cover details of EJB such that a developer will be able to understand the basics of the EJB usage and implementation. I consider the EJB requirements of the Red
Hat’s Enterprise Application Developer Exam (EX183) as a basic reference of requirements for a programmer starting with Java EE, but may cover some topics more in-depth and other topics less so.

# What’s an EJB

An _EJB_ (Enterprise Java Bean) is a server-backed _POJO_ (plain old Java object). This translates to turning your Java class into a class that lives, dies, and is managed in a Java application server. Use EJBs to achieve one or more of the following:

* Concurrency out of the box
* Transaction management using JTA (Java Transaction API)
* Simplified work with databases: EJBs have access to databases via the container, and are able to leverage JPA with greater ease than Java classes which aren’t manager.
* Easier scalability
* Dependency Injection (this will be discussed later)


This series will go into detail about some of the above-mentioned points in separate posts, so don’t worry about not having heard of one or more of the concepts. When designing EJBs, there are two fundamental concepts that change how an EJB behaves:

1. Message-driven EJBs 
2. State-driven EJBs


Message-driven EJBs are used for asynchronous Java messaging systems (JMS), and are out of scope for this series. There are three basic state-driven EJBs:

1. Stateless: No state between bean invocation is guaranteed
2. Stateful: Client state between bean invocation is guaranteed
3. Singleton: There is only one instance of the bean with state and resources shared throughout all the invocations

When you start your Java server, it creates a pool of stateless EJBs that you can use. When you request to use the bean in your application, you may not need any state preserved. Maybe you only need to count a discount, or choose which symbol to display. In such case, you would use a stateless bean. A stateless bean may have a state, but if the same instance is used on a different client which changes the state, your next usage of the same bean will not have the same state.
Stateful EJBs, on the other hand, guarantee that your session will use a specific EJB instance so that you can guarantee the internal state. A typical example is a shopping cart, or a TODO app, when you want your items to be preserved for the duration of the session.
A singleton EJB is then typically used for accessing the database or resources shared across the whole application.

## Example

Consider the following Java object:

```java
public class Greeter {
     String name;
     public String greet(){
         return "Hello, " + name;
     }
     public String getName() {
         return name;
     }
     public void setName(String name) {
         this.name = name;
      } 
}
```

The only change required to make this a stateless EJB is the _@Stateless_ annotation:

```java
import javax.ejb.Stateless;

@Stateless
public class Greeter {
     String name;
     public String greet(){
         return "Hello, " + name;
     }
     public String getName() {
         return name;
     }
     public void setName(String name) {
         this.name = name;
      } 
}
```

Similarly, you can turn a POJO into a stateful EJB using _@Stateful_ and into a Singleton EJB using @_Singleton_ annotations.
