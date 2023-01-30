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

// /************************************** get */

// describe("get", function () {
//   test("works", async function () {
//     let company = await Company.get("c1");
//     expect(company).toEqual({
//       handle: "c1",
//       name: "C1",
//       description: "Desc1",
//       numEmployees: 1,
//       logoUrl: "http://c1.img",
//     });
//   });

//   test("not found if no such company", async function () {
//     try {
//       await Company.get("nope");
//       fail();
//     } catch (err) {
//       expect(err instanceof NotFoundError).toBeTruthy();
//     }
//   });
// });

// /************************************** update */

// describe("update", function () {
//   const updateData = {
//     name: "New",
//     description: "New Description",
//     numEmployees: 10,
//     logoUrl: "http://new.img",
//   };

//   test("works", async function () {
//     let company = await Company.update("c1", updateData);
//     expect(company).toEqual({
//       handle: "c1",
//       ...updateData,
//     });

//     const result = await db.query(
//       `SELECT handle, name, description, num_employees, logo_url
//            FROM companies
//            WHERE handle = 'c1'`
//     );
//     expect(result.rows).toEqual([
//       {
//         handle: "c1",
//         name: "New",
//         description: "New Description",
//         num_employees: 10,
//         logo_url: "http://new.img",
//       },
//     ]);
//   });

//   test("works: null fields", async function () {
//     const updateDataSetNulls = {
//       name: "New",
//       description: "New Description",
//       numEmployees: null,
//       logoUrl: null,
//     };

//     let company = await Company.update("c1", updateDataSetNulls);
//     expect(company).toEqual({
//       handle: "c1",
//       ...updateDataSetNulls,
//     });

//     const result = await db.query(
//       `SELECT handle, name, description, num_employees, logo_url
//            FROM companies
//            WHERE handle = 'c1'`
//     );
//     expect(result.rows).toEqual([
//       {
//         handle: "c1",
//         name: "New",
//         description: "New Description",
//         num_employees: null,
//         logo_url: null,
//       },
//     ]);
//   });

//   test("not found if no such company", async function () {
//     try {
//       await Company.update("nope", updateData);
//       fail();
//     } catch (err) {
//       expect(err instanceof NotFoundError).toBeTruthy();
//     }
//   });

//   test("bad request with no data", async function () {
//     try {
//       await Company.update("c1", {});
//       fail();
//     } catch (err) {
//       expect(err instanceof BadRequestError).toBeTruthy();
//     }
//   });
// });

// /************************************** remove */

// describe("remove", function () {
//   test("works", async function () {
//     await Company.remove("c1");
//     const res = await db.query(
//       "SELECT handle FROM companies WHERE handle='c1'"
//     );
//     expect(res.rows.length).toEqual(0);
//   });

//   test("not found if no such company", async function () {
//     try {
//       await Company.remove("nope");
//       fail();
//     } catch (err) {
//       expect(err instanceof NotFoundError).toBeTruthy();
//     }
//   });
// });
