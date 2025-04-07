document.addEventListener("DOMContentLoaded", () => {
  let currentBalance = document.getElementById("balance");
  const formTopUp = document.getElementById("top-up");
  const formAddExpense = document.getElementById("expense-form");
  let categories = [];
  let selectCategory = document.getElementById("category-select");
  let expenditureTableBody = document.getElementById("expenditures-body");
  let buttonResetAll = document.getElementById("reset-button");
  let selectedCategory = "";

  //base url for balance
  const balanceBaseUrl =
    "https://personal-expense-tracker-backend-27c8.onrender.com/currentBalance";
  //base url for expenses
  const expensesBaseUrl =
    "https://personal-expense-tracker-backend-27c8.onrender.com/expenses";

  //call get balance to update dom
  getBalance();
  fetchExpenses();

  /**
   * This function makes request for current balance
   * updates the dom of current balance
   */
  function getBalance() {
    const requestOptions = {
      method: "GET",
      redirect: "follow",
    };

    fetch(balanceBaseUrl, requestOptions)
      .then((response) => {
        //convert response to text
        return response.json();
      })
      .then((result) => {
        //fetch balance from results
        console.log(result);
        currentBalance.textContent = result.currentBalance.toFixed(2);
      })
      .catch((error) => console.log("error", error));
  }

  /**
   * method updates the expense category list by fetching from server
   */
  function fetchExpenses() {
    const requestOptions = {
      method: "GET",
      redirect: "follow",
    };
    fetch(expensesBaseUrl, requestOptions)
      .then((response) => response.json())
      .then((jsonResponse) => {
        renderTable(jsonResponse);
        //update category list and sort them alphabetically
        categories = jsonResponse.map((expense) => expense.category).sort();
        selectedCategory = categories[0];
        //update select
        categories.forEach((c) => {
          //create an option element
          let option = document.createElement("option");
          option.textContent = c;
          option.value = c;
          selectCategory.appendChild(option);
        });
      });
  }

  function renderTable(data) {
    const tableBody = document.getElementById("expense-table-body");
    const totalAmount = data.reduce((sum, expense) => sum + expense.amount, 0);
    tableBody.innerHTML = ""; // Clear existing rows

    data.forEach((expense, index) => {
      const row = tableBody.insertRow();
      row.insertCell(0).textContent = expense.category;
      row.insertCell(1).textContent = expense.amount.toFixed(2);
      row.insertCell(2).textContent = expense.description;
      // Action buttons (Reset)
      const resetCell = row.insertCell(3);
      const resetButton = document.createElement("button");
      resetButton.textContent = "Reset";
      resetButton.onclick = () => resetSingle(expense.id);
      resetCell.appendChild(resetButton);
    });

    document.getElementById(
      "total-amount"
    ).textContent = `KES ${totalAmount.toFixed(2)}`;
  }

  const resetSingle = (id) => {
    //   Show confirmaton prompt before resetting expense in a category
    if (
      confirm(
        "Are you sure you want to reset this category? This will set the amount to zero and cannot be undone."
      )
    ) {
      fetch(`${expensesBaseUrl}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ amount: 0 }),
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => {
          return response.json();
        })
        .then((result) => {
          console.log("Category reset was successful");
        })

        .catch((error) => console.log("error", error));
    }
  };

  const topUp = (amount) => {
    //create request body
    const data = {
      currentBalance: Number(currentBalance.innerText) + Number(amount),
    };
    fetch(balanceBaseUrl, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        console.log(result);
        currentBalance.textContent = result.currentBalance.toFixed(2);
      })

      .catch((error) => console.log("error", error));
  };

  const spendBalance = (amount) => {
    //create request body
    const data = {
      currentBalance: Number(currentBalance.innerText) - Number(amount),
    };
    fetch(balanceBaseUrl, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        console.log(result);
        currentBalance.textContent = result.currentBalance;
      })

      .catch((error) => console.log("error", error));
  };

  /**
   * Add an amount spent on a category
   * @param {*} requestBody
   */
  const addExpense = (requestBody) => {
    if (Number(currentBalance.innerText) < Number(requestBody.amount)) {
      formAddExpense.reset();
      alert("Your balance is less than the amount you want to spend");
    } else {
      console.log(requestBody);
      fetch(`${expensesBaseUrl}/${requestBody.id}`, {
        method: "PATCH", //avoid changing desc
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => {
          return response.json();
        })
        .then((result) => {
          spendBalance(requestBody.userAmount);
        })

        .catch((error) => console.log("error", error));
    }
  };

  /**
   * function to reset the expenses on all categories and Current balance
   */
  const resetAllAction = () => {
    //   Show confirmaton prompt before resetting all the expenses.
    if (
      confirm(
        "Are you sure you want to reset everything? This will reset all expenses and your current balance to zero and cannot be undone."
      )
    ) {
      fetch(expensesBaseUrl)
        .then((response) => response.json())
        .then((expenses) => {
          // Update the 'amount' field to 0 for each record
          expenses.forEach((expense) => {
            expense.amount = 0;
            fetch(`${expensesBaseUrl}/${expense.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(expense), // Send the updated data
            })
              .then((response) => response.json())
              .then((data) => {
                console.log("All amounts updated to 0:", data);
              })
              .catch((error) => {
                console.error("Error updating records:", error);
              });
          });
        })
        .catch((error) => {
          console.error("Error fetching expenses:", error);
        });

      // Reset current balance to 0
      fetch(balanceBaseUrl, {
        method: "PUT",
        body: JSON.stringify({ currentBalance: 0 }),
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => response.json())
        .then((result) => {
          console.log("Balance reset to 0:", result);
          currentBalance.textContent = "0.00"; // Update UI
        })
        .catch((error) => console.log("Error resetting balance:", error));
    }
  };

  /**
   * function that fetches amount and id by a category
   * @param {*} categoryName
   */
  function amountId() {
    return new Promise((resolve, reject) => {
      console.log(selectedCategory);
      const requestOptions = {
        method: "GET",
        redirect: "follow",
      };
      fetch(`${expensesBaseUrl}?category=${selectedCategory}`, requestOptions)
        .then((response) => response.json())
        .then((jsonResponse) => {
          console.log(jsonResponse[0].id);
          resolve({
            id: jsonResponse[0].id,
            amountCurrently: jsonResponse[0].amount,
          });
        })
        .catch((error) => {
          console.error("Error fetching expense by category:", error);
          reject(error);
        });
    });
  }

  //=======EVENT LISTENERS======

  // Call topupBalance() on submit button
  formTopUp.addEventListener("submit", (event) => {
    event.preventDefault();
    const topUpAmount = document.getElementById("topup-amount").value;
    topUp(topUpAmount);
  });

  //select change event listener
  selectCategory.addEventListener("change", () => {
    selectedCategory = selectCategory.value;
  });

  /**
   * Take user input and add the current amount to update the
   * amount used on a specific category
   */
  formAddExpense.addEventListener("submit", (e) => {
    e.preventDefault();
    const category = selectCategory.value;
    const amount = document.getElementById("input-amount").value;
    amountId()
      .then((amountIdResults) => {
        const requestBody = {
          amount: Number(amountIdResults.amountCurrently) + Number(amount),
          category: category,
          userAmount: amount,
          id: amountIdResults.id,
        };

        //call the add expense method
        addExpense(requestBody);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });

  //reset everything click event listener
  buttonResetAll.addEventListener("click", (e) => resetAllAction());
});
