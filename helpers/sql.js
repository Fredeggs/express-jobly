const { BadRequestError, ExpressError } = require("../expressError");
const _ = require("lodash");

// sqlForPartialUpdate(dataToUpdate, jsToSql)
// requires inputs:
// 1) dataToUpdate: an Object containg the key/value pairs where the key is the SQL column and the value is the updated data value
// 2) jsToSql: an Object containg key/value pairs where the key is js version of the SQL column name and the value is the actual SQL column name
//
// return an object containing:
// 1) setCols: a String representing the portion of a SQL query that updates specified values of one record
// 2) values: an Array of the inputted values that will be used to update

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

// sqlForFiltering(filters, jsToSql)
// requires inputs:
// 1) filters: an object containing key/value pairs where the key is the filter and the value is the filtering data
//
// return an object containing:
// 1) setCols: a String representing the portion of a SQL query that updates specified values of one record
// 2) values: an Array of the inputted values that will be updated

function sqlForFiltering(filters, jsToSql) {
  const keys = Object.keys(filters);
  if (keys.length === 0) throw new BadRequestError("No data");
  if (filters.minEmployees && filters.maxEmployees) {
    if (filters.minEmployees > filters.maxEmployees)
      throw new ExpressError(
        "Minimum number of employees cannot be greater than maximum number of employees"
      );
  }

  // {name: 'Apple', minEmployees: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) => {
    switch (colName) {
      case "name":
        return `"${jsToSql[colName] || colName}" LIKE $${idx + 1}`;
      case "minEmployees":
        return `"${jsToSql[colName] || colName}" >= $${idx + 1}`;
      case "maxEmployees":
        return `"${jsToSql[colName] || colName}" <= $${idx + 1}`;
      case "title":
        return `"${jsToSql[colName] || colName}" LIKE $${idx + 1}`;
      case "minSalary":
        return `"${jsToSql[colName] || colName}" >= $${idx + 1}`;
      case "hasEquity":
        if (filters.hasEquity) {
          return `"${jsToSql[colName] || colName}" > 0`;
        }
    }
  });

  const filteredCols = cols.filter(function (element) {
    return element !== undefined;
  });

  if (_.isEqual(filters, { hasEquity: false })) {
    delete filters.hasEquity;
    return {
      setFilters: "",
      values: Object.values(filters),
    };
  }
  delete filters.hasEquity;
  return {
    setFilters: `WHERE ${filteredCols.join(" AND ")}`,
    values: Object.values(filters),
  };
}

module.exports = { sqlForPartialUpdate, sqlForFiltering };
