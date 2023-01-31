"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForFiltering } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if companyHandle does not exist in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const companyExists = await db.query(
      `SELECT handle, name
           FROM companies
           WHERE handle = $1`,
      [companyHandle]
    );
    if (companyExists.rows.length === 0)
      throw new NotFoundError(`Company does not exist: ${companyHandle}`);

    const result = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll(filters) {
    const jsToSql = {
      title: "title",
      minSalary: "salary",
      hasEquity: "equity",
    };
    if (filters) {
      const { setFilters, values } = sqlForFiltering(filters, jsToSql);
      const sqlQuery = `
            SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
            FROM jobs
            ${setFilters}`;
      if (filters.hasEquity && !filters.title && !filters.minSalary) {
        const jobsRes = await db.query(sqlQuery);
        return jobsRes.rows;
      }
      const jobsRes = await db.query(sqlQuery, [...values]);
      return jobsRes.rows;
    }
    const jobsRes = await db.query(`
        SELECT id,
          title,
          salary,
          equity,
          company_handle AS "companyHandle"
        FROM jobs`);
    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobsRes = await db.query(
      `
    SELECT id,
        title,
        salary,
        equity,
        company_handle AS "companyHandle"
    FROM jobs
    WHERE id = $1`,
      [id]
    );

    const job = jobsRes.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, companyHandle}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      companyHandle: "company_handle",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id, 
                                title, 
                                salary,
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No company: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
  }
}

module.exports = Job;
