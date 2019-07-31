---
layout: post
title: "Ansible - difference between facts and variables"
image: img/article-background.png
author: Marek
draft: true
date: 2019-07-31T19:00:00Z
excerpt: "A quick look at when to use facts and when variables in Ansible"
tags:
  - Ansible
  - "Red Hat"
---

In Ansible, there are many ways to use variables. One such way is to set facts
on a host (or a group) such that we can use the fact like a typical variable.
But why would you do so? Why not use a simple `var` directive?

# Comparison

Consider the following two examples:

```yaml
vars:
    variable: "my var"
```

```yaml
tasks:
  - set_fact:
      fact: "my fact var"
```

We can use both in the same manner: `"{{ variable }}"` (or `"{{ fact }}"` respectively).

Typically, you'll find that one of the differences is the fact that fact is not
evaluated when used, while variable is. That is true, but it's not useful
for static texts. So, for texts, the two constructs are the same?

Not really...

# Ansible roles to the rescue

In Ansible, you can view roles as an independent unit of work--for example,
deploying an HTTP server, or a database. However, a key to great Ansible role
is its reusability.

Similarly to methods in programming, you sometimes have to take inputs, and
sometimes, you want to return values. That's where facts come into play!

If you use variables, the value will be lost when a role is finished. However,
if you set a fact, the value will be preserved for any subsequent roles.

# Practical example

Consider the following roles structure:

```
roles/
├── check_python
│   ├── tasks
│   │   └── main.yml
│   └── vars
│       └── main.yml
└── list_python_binaries
    └── tasks
        └── main.yml
```
We have two roles: `check_python` and `list_python_binaries`.

The first role checks which Python binaries are available on the target system
and sets the result as a fact:

```yaml
---
- name: Check for the Python2 binary
  command: "{{ python2 }} --version"
  ignore_errors: true
  register: python2

- name: Add the Python2 binary to list if it exists
  set_fact:
    python_binaries: "{{ python_binaries + ['python'] }}"
  #when: python2.rc == 0

- name: Check for the Python3 binary
  command: "{{ python3 }} --version"
  register: python3

- name: Add the Python3 binary to list if it exists
  set_fact:
    python_binaries: "{{ python_binaries + ['python3'] }}"
  when: python3.rc == 0
```

If this was a method in a programming/scripting language, the return value would
be a list of strings. In Ansible, we can set this list as a fact on the host.

The second role, `list_python_binaries`, then takes the input parameter, and
in our case, simply reads it:

```yaml
---
# tasks file for roles/list_python_binaries
- name: Listing python binaries
  debug:
    msg: "Python {{ python_binaries }} binaries exist on the system"
```
In this manner, you can create roles which are independent of playbooks. You must
document well input and output parameters so that the consumers of your role know
what the role expects. For that, you'll gain a role reusable in many contexts.

# Conclusion

Use variables for values that live and die with your playbook, or role. Use facts
to create powerful, reusable roles, which either need input parameters, or return values.

You can view and run the example over at the [code sample repository](https://github.com/m-czernek/code-samples/tree/master/ansible_facts).
