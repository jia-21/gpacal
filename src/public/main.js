/**
 * ================================
 *             Grades
 * ================================
 */
const gradeToScore = {
  A: 4,
  'B+': 3.5,
  B: 3,
  'C+': 2.5,
  C: 2,
  'D+': 1.5,
  D: 1,
  'D-': 0.5,
  F: 0,
};
function calculateGpa(modules) {
  let totalModuleCredit = 0;
  let totalScore = 0;
  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];
    if (!modules[i].grade) continue;
    const { grade, moduleCredit } = module;
    const score = gradeToScore[grade];
    totalModuleCredit += moduleCredit;
    totalScore += score * moduleCredit;
  }
  console.log(totalModuleCredit, totalScore);
  const gpa = totalModuleCredit ? totalScore / totalModuleCredit : 0;
  return gpa;
}

/**
 * ================================
 *         API connectors
 * ================================
 */
function connectToDatabase(connectionString, isReset) {
  return fetch(`/connect?reset=${isReset}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      connectionString,
    }),
  }).then(function (response) {
    if (response.status === 200) {
      return;
    }
    return response.json().then(function (response) {
      throw new Error(response.error);
    });
  });
}

function createModule(moduleCode, moduleCredit) {
  return fetch(`/api/modules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      moduleCode: moduleCode,
      moduleCredit: moduleCredit,
    }),
  }).then(function (response) {
    if (response.status === 201) {
      return;
    }
    return response.json().then(function (json) {
      if (json.error) {
        throw new Error(json.error);
      }
      throw new Error(`Unexpected response body: ${JSON.stringify(json)}`);
    });
  });
}

function getModules() {
  return fetch('/api/modules')
    .then(function (response) {
      return response.json();
    })
    .then(function (json) {
      if (json.error) {
        throw new Error(json.error);
      }
      return json.modules;
    });
}

function updateModule(moduleCode, grade) {
  return fetch(`/api/modules/${moduleCode}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ grade }),
  }).then(function (response) {
    if (response.status === 200) {
      return;
    }
    return response.json().then(function (json) {
      if (json.error) {
        throw new Error(json.error);
      }
      throw new Error(`Unknown Response ${JSON.stringify(json)}`);
    });
  });
}

function deleteModule(moduleCode, grade) {
  return fetch(`/api/modules/${moduleCode}`, {
    method: 'DELETE',
  }).then(function (response) {
    if (response.status === 200) {
      return;
    }
    return response.json().then(function (json) {
      if (json.error) {
        throw new Error(json.error);
      }
      throw new Error(`Unknown Response ${JSON.stringify(json)}`);
    });
  });
}

/**
 * ================================
 *              Main
 * ================================
 */
window.addEventListener('DOMContentLoaded', function () {
  /**
   * ================================
   *        Element References
   * ================================
   */
  const connectionStringInput = document.getElementById('connection-string');
  const connectButton = document.getElementById('connect');
  const resetCheckbox = document.getElementById('reset');
  const moduleCodeInput = document.getElementById('module-code');
  const moduleCreditInput = document.getElementById('module-credit');
  const createModuleButton = document.getElementById('create-module');
  const modulesTable = document.getElementById('modules');
  // Ref: https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
  const rowTemplate = document.querySelector('#module-row');
  const gpaField = document.getElementById('gpa');

  /**
   * ================================
   *        Connect Button
   * ================================
   */
  connectButton.addEventListener('click', function () {
    if (!connectionStringInput.reportValidity()) {
      return;
    }
    const connectionString = connectionStringInput.value;
    const isReset = resetCheckbox.checked;
    connectButton.disabled = true;
    connectToDatabase(connectionString, isReset)
      .then(function () {
        alert('Successfully connected to Database!');
      })
      .then(function () {
        return refreshModulesTable();
      })
      .catch(function (error) {
        alert(error);
      })
      .finally(function () {
        connectButton.disabled = false;
      });
  });

  /**
   * ================================
   *      Create Module Button
   * ================================
   */

  createModuleButton.onclick = function () {
    // Ref: https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity
    if (!moduleCodeInput.reportValidity() || !moduleCreditInput.reportValidity()) {
      return;
    }
    const moduleCode = moduleCodeInput.value;
    const moduleCredit = moduleCreditInput.value;
    createModuleButton.disabled = true;
    createModule(moduleCode, moduleCredit)
      .then(function () {
        alert('Successfully Created!');
      })
      .catch(function (error) {
        alert(error.message);
      })
      .finally(function () {
        refreshModulesTable();
        createModuleButton.disabled = false;
      });
  };

  /**
   * ================================
   *     Module Table functions
   * ================================
   */
  function createModuleRow(module) {
    // Ref: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template
    const newRow = rowTemplate.content.cloneNode(true);

    newRow.querySelector('.row-module-id').textContent = module.id;
    newRow.querySelector('.row-module-code').textContent = module.moduleCode;
    newRow.querySelector('.row-module-credit').textContent = module.moduleCredit;

    const moduleGradeSelect = newRow.querySelector('.row-module-grade');
    moduleGradeSelect.value = module.grade || '';

    // Update and refresh table and GPA computation
    const updateButton = newRow.querySelector('.row-update');
    updateButton.onclick = function () {
      return updateModule(module.moduleCode, moduleGradeSelect.value)
        .then(function () {
          alert(`Update Successfully! ${module.moduleCode} -> ${moduleGradeSelect.value}`);
          return refreshModulesTable();
        })
        .catch(function (error) {
          alert(error.message);
        });
    };

    // Delete and refresh table and GPA computation
    const deleteButton = newRow.querySelector('.row-delete');
    deleteButton.onclick = function () {
      return deleteModule(module.moduleCode)
        .then(function () {
          alert(`Delete Successfully! ${module.moduleCode}`);
          return refreshModulesTable();
        })
        .catch(function (error) {
          alert(error.message);
        });
    };
    return newRow;
  }

  // Refresh table and GPA computation
  function refreshModulesTable() {
    return getModules()
      .then(function (modules) {
        modulesTable.innerHTML = '';
        modules.forEach(function (module) {
          const moduleRow = createModuleRow(module);
          modulesTable.appendChild(moduleRow);
        });

        gpaField.innerHTML = '';
        const gpa = calculateGpa(modules);
        gpaField.textContent = gpa;
      })
      .catch(function (error) {
        return alert(error.message);
      });
  }
});
