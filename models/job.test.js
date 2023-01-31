"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "test title",
    salary: 80000,
    equity: 0.0005,
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: newJob.title,
      salary: newJob.salary,
      equity: newJob.equity.toString(),
      companyHandle: newJob.companyHandle,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'test title'`
    );
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: newJob.title,
        salary: newJob.salary,
        equity: newJob.equity.toString(),
        companyHandle: newJob.companyHandle,
      },
    ]);
  });

  test("try to create job with non-existent company", async function () {
    try {
      await Job.create({
        title: "Engineer 1",
        salary: 80000,
        equity: 0.0005,
        companyHandle: "Does not exist",
      });
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 50000,
        equity: "0.0005",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 60000,
        equity: "0.0006",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 100000,
        equity: "0",
        companyHandle: "c3",
      },
    ]);
  });

  test("works: with title filter", async function () {
    const filters = { title: "j1" };
    let jobs = await Job.findAll(filters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 50000,
        equity: "0.0005",
        companyHandle: "c1",
      },
    ]);
  });

  test("works: with minSalary filter", async function () {
    const filters = { minSalary: 55000 };
    let jobs = await Job.findAll(filters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 60000,
        equity: "0.0006",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 100000,
        equity: "0",
        companyHandle: "c3",
      },
    ]);
  });

  test("works: with hasEquity filter", async function () {
    const filters = { hasEquity: true };
    let jobs = await Job.findAll(filters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 50000,
        equity: "0.0005",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 60000,
        equity: "0.0006",
        companyHandle: "c2",
      },
    ]);
  });

  test("works: with multiple filters", async function () {
    const filters = { minSalary: 55000, hasEquity: false };
    let jobs = await Job.findAll(filters);
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 60000,
        equity: "0.0006",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 100000,
        equity: "0",
        companyHandle: "c3",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const { id } = await Job.create({
      title: "test title",
      salary: 80000,
      equity: 0.0005,
      companyHandle: "c1",
    });
    let job = await Job.get(id);
    expect(job).toEqual({
      id: id,
      title: "test title",
      salary: 80000,
      equity: "0.0005",
      companyHandle: "c1",
    });
  });

  test("not found if job id does not exist", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New Job",
    salary: 999999,
    equity: 1,
    companyHandle: "c1",
  };

  test("works", async function () {
    let newJob = await Job.create({
      title: "test title",
      salary: 80000,
      equity: 0.0005,
      companyHandle: "c1",
    });
    let job = await Job.update(newJob.id, updateData);
    expect(job).toEqual({
      id: newJob.id,
      title: "New Job",
      salary: 999999,
      equity: "1",
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${newJob.id}`
    );
    expect(result.rows).toEqual([
      {
        id: newJob.id,
        title: "New Job",
        salary: 999999,
        equity: "1",
        companyHandle: "c1",
      },
    ]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "Not null title",
      salary: null,
      equity: null,
      companyHandle: "c1",
    };
    let newJob = await Job.create({
      title: "test title",
      salary: 80000,
      equity: 0.0005,
      companyHandle: "c1",
    });

    let job = await Job.update(newJob.id, updateDataSetNulls);
    expect(job).toEqual({
      id: newJob.id,
      title: "Not null title",
      salary: null,
      equity: null,
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
             FROM jobs
             WHERE id = ${newJob.id}`
    );
    expect(result.rows).toEqual([
      {
        id: newJob.id,
        title: "Not null title",
        salary: null,
        equity: null,
        companyHandle: "c1",
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      let newJob = await Job.create({
        title: "test title",
        salary: 80000,
        equity: 0.0005,
        companyHandle: "c1",
      });
      await Job.update(newJob.id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    let newJob = await Job.create({
      title: "test title",
      salary: 80000,
      equity: 0.0005,
      companyHandle: "c1",
    });
    await Job.remove(newJob.id);
    const res = await db.query(`SELECT id FROM jobs WHERE id=${newJob.id}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
