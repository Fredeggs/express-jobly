const {sqlForPartialUpdate, sqlForFiltering} = require("./sql")
const { BadRequestError, ExpressError } = require("../expressError");

describe("sqlForPartialUpdate", function () {
  test("works with a jsToSql", function () {
    const data = {firstName: "Jeffrey", lastName: "Eggbert"}
    const jsToSql = {firstName: "first_name", lastName: "last_name"}
    expect(sqlForPartialUpdate(data, jsToSql)).toEqual({
        setCols: `"first_name"=$1, "last_name"=$2`,
        values: ["Jeffrey", "Eggbert"],
    });
  });

  test("throws an error when there is no data given", function () {
    const data = {}
    const jsToSql = {}
    expect(() => sqlForPartialUpdate(data, jsToSql)).toThrow(BadRequestError)
  });

})

describe("sqlForFiltering", function () {
    test("works with filtering by name", function () {
      const filters = {name: "Jeffrey"}
      const jsToSql = {name: "name"}
      expect(sqlForFiltering(filters, jsToSql)).toEqual({
          setFilters: `WHERE "name" LIKE $1`,
          values: ["Jeffrey"],
      });
    });

    test("works with filtering by number of employees", function () {
        const filters = {minEmployees: 28, maxEmployees: 30}
        const jsToSql = {minEmployees: "num_employees", maxEmployees: "num_employees"}
        expect(sqlForFiltering(filters, jsToSql)).toEqual({
            setFilters: `WHERE "num_employees" >= $1 AND "num_employees" <= $2`,
            values: [28, 30],
        });
      });
  
    test("throws an error if minEmployees is greater than maxEmployees", function () {
        const filters = {minEmployees: 38, maxEmployees: 20}
        expect(() => sqlForFiltering(filters)).toThrow(ExpressError)
    });
})
