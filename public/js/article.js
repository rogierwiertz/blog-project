const commentOutput = document.getElementById("commentOutput");
const articleId = commentOutput.getAttribute("data-article");
const totalCommentsElFirst = document.getElementById("totalCommentsFirst");
const totalCommentsElSecond = document.getElementById("totalComments");
let totalComments = +totalCommentsElFirst.innerText;
let commentsLoaded = 0;

// Manage total comments display on page.
// @param add (true for + 1, false for - 1)
const updateTotalComments = (add) => {
  add ? (totalComments += 1) : (totalComments -= 1);
  totalCommentsElFirst.innerText = totalComments.toString();
  totalCommentsElSecond.innerText = totalComments.toString();
};

// Get comments
// @param btn (the 'Show more' button element)
// @param num (optional) for limit (standard = 3)
const getComments = (btn, num = 3) => {
  const limit = num;
  if (btn) {
    btn.setAttribute("disabled", "");
    btn.innerHTML = `
        <span
        class="spinner-border spinner-border-sm"
        role="status"
        aria-hidden="true"
        ></span>
        Loading...
        `;
  }

  fetch(
    `/article/get-comments?article=${articleId}&offset=${commentsLoaded}&limit=${limit}`,
    {
      method: "GET",
    }
  )
    .then((res) => {
      return res.json();
    })
    .then((json) => {
      if (json.statusCode >= 400) {
        if (btn) {
          if (totalComments > commentsLoaded) {
            btn.removeAttribute("disabled");
          }
          btn.innerHTML = "Show more";
          return (commentOutput.innerHTML = `
                <div class="alert alert-warning my-4" role="alert">
                  <p class="mb-0">${json.message}</p>
                 </div>  
              `);
        }
      }
      const df = new DocumentFragment();
      const loggedInUser = json.userId;
      json.comments.forEach((comment) => {
        const firstName = comment.author.firstName;
        const lastName = comment.author.lastName;
        const profileImage = comment.author.profileImage;
        const content = comment.content;
        const authorId = comment.author._id;
        const deleteButton = authorId === loggedInUser;
        const commentId = comment._id;

        const row = createComment(
          firstName,
          lastName,
          profileImage,
          content,
          deleteButton,
          commentId
        );

        df.appendChild(row);
      });
      commentOutput.appendChild(df);

      commentsLoaded += json.comments.length;

      if (btn) {
        if (totalComments > commentsLoaded) {
          btn.removeAttribute("disabled");
        }
        btn.innerHTML = "Show more";
      }
    })
    .catch();
};

// Create HTML for new comment
// @params deleteButton (true if deleteButton should be added)
const createComment = (
  firstName,
  lastName,
  profileImage,
  content,
  deleteButton,
  commentId
) => {
  const row = document.createElement("div");
  row.classList.add("row", "mb-4", "btn-light", "rounded");

  const colImage = document.createElement("div");
  colImage.classList.add("col-2");
  const img = document.createElement("img");
  img.src = profileImage;
  img.alt = firstName + " " + lastName;
  img.classList.add("img-fluid", "shadow-1-strong", "rounded", "mt-3", "mb-3");
  colImage.appendChild(img);

  const colText = document.createElement("div");
  colText.classList.add("col-10", "p-3");
  const name = document.createElement("p");
  name.classList.add("mb-2");
  const strong = document.createElement("strong");
  strong.innerText = firstName + " " + lastName;
  const text = document.createElement("p");
  text.innerText = content;
  name.appendChild(strong);
  colText.appendChild(name);
  colText.appendChild(text);

  if (deleteButton) {
    row.classList.add("border", "border-dark");
    row.setAttribute("data-id", commentId);
    img.classList.remove("mb-3");
    const btnDelete = document.createElement("button");
    btnDelete.setAttribute("type", "button");
    btnDelete.setAttribute("onclick", "deleteModal.show(this)");
    btnDelete.classList.add("btn", "btn-link", "btn-block", "my-1");
    btnDelete.innerHTML = '<i class="text-danger far fa-trash-alt"></i>';
    btnDelete.setAttribute("data-id", commentId);
    colImage.appendChild(btnDelete);
  }

  row.appendChild(colImage);
  row.appendChild(colText);

  return row;
};

// Add a new comment
// @param btn (the 'Add comment' button element)
const addComment = (btn) => {
  const articleId = btn.closest("div").querySelector("[name=article]").value;
  const csrf = document
    .querySelector("meta[name=csrf-token]")
    .getAttribute("content");
  const author = btn.closest("div").querySelector("[name=author]").value;
  const message = btn.closest("div").querySelector("[name=message]").value;

  const body = {
    article: articleId,
    _csrf: csrf,
    author: author,
    message: message,
  };

  fetch("/article/add-comment", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => {
      return res.json();
    })
    .then((json) => {
      if (json.statusCode >= 400) {
        error = true;
        return displayMessage(json.message, error);
      }
      updateTotalComments(true);
      commentsLoaded++;
      const row = createComment(
        json.firstName,
        json.lastName,
        json.profileImage,
        json.content,
        true,
        json._id
      );
      commentOutput.insertBefore(row, commentOutput.firstChild);
      btn.closest("div").querySelector("[name=message]").value = "";
    })
    .catch();
};

// Delete comment
// @param btn (the 'delete comment' button element)
const deleteComment = (btn) => {
  const commentId = btn.getAttribute("data-id");
  const csrf = document
    .querySelector("meta[name=csrf-token]")
    .getAttribute("content");

  fetch(`/article/delete-comment?id=${commentId}&article=${articleId}`, {
    method: "DELETE",
    headers: {
      "csrf-token": csrf,
    },
  })
    .then((res) => {
      return res.json();
    })
    .then((json) => {
      if (json.statusCode >= 400) {
        error = true;
        return displayMessage(json.message, error);
      }
      commentOutput.querySelector(`div[data-id='${commentId}']`).remove();
      updateTotalComments(false);
      commentsLoaded--;
      getComments(document.getElementById("getCommentsBtn"), 1);
    })
    .catch();
};

// Like or unlike article
const likeArticle = (btn) => {
  const articleId = btn.getAttribute("data-article");
  const csrf = document
    .querySelector("meta[name=csrf-token]")
    .getAttribute("content");
  const body = {
    articleId: articleId,
    _csrf: csrf,
  };

  fetch("/article/like-article", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
    .then((res) => {
      return res.json();
    })
    .then((json) => {
      if (json.statusCode >= 400) {
        return displayMessage(json.message, true);
      }
      if (json.state === "liked") {
        btn.classList.remove("btn-outline-dark");
        btn.classList.add("btn-danger");
      }
      if (json.state === "unliked") {
        btn.classList.add("btn-outline-dark");
        btn.classList.remove("btn-danger");
      }
      btn.closest("div").querySelector("span").textContent = json.likes;
    })
    .catch();
};

// Get latest articles and display on the sidebar
const getLatestArticles = () => {
  const sidebar = document.getElementById("sidebar");

  fetch(`/article/latest-articles/${articleId}`)
    .then((res) => {
      if (res.status >= 400) {
        sidebar.parentElement.parentElement.firstElementChild.classList.remove(
          "col-lg-8"
        );
        sidebar.parentElement.remove();
        throw new Error("Failed to load latest articles.");
      }
      return res.json();
    })
    .then((json) => {
      const df = new DocumentFragment();
      json.forEach((article) => {
        const div1 = document.createElement("div");
        div1.classList.add(
          "bg-image",
          "ripple",
          "mb-4",
          "rounded",
          "shadow-2-strong"
        );

        const img = document.createElement("img");
        img.classList.add("img-fluid");
        img.style.marginBottom = "89px";
        img.src = article.image;
        const a = document.createElement("a");
        a.setAttribute("href", `/article/${article._id}`);
        const aMask = document.createElement("div");
        aMask.classList.add("mask");
        aMask.style.backgroundColor = "rgba(0, 0, 0, 0.377)";
        const info = document.createElement("div");
        info.classList.add(
          "d-flex",
          "flex-wrap",
          "justify-content-center",
          "align-content-end",
          "bg-dark",
          "w-100"
        );
        info.style.position = "absolute";
        info.style.bottom = "0";
        const title = document.createElement("h4");
        title.classList.add(
          "text-light",
          "mb-1",
          "mt-3",
          "w-100",
          "text-center"
        );
        title.textContent = article.title;
        const author = document.createElement("p");
        author.classList.add("text-light");
        author.textContent = `by ${article.author.firstName} ${article.author.lastName}`;

        const overlay = document.createElement("div");
        overlay.classList.add("hover-overlay");
        const divMask = document.createElement("div");
        divMask.classList.add("mask");
        divMask.style.backgroundColor = "rgba(251, 251, 251, 0.2)";

        const badge = document.createElement("span");
        badge.textContent = "New";
        badge.classList.add("badge", "bg-primary", "me-2");

        overlay.appendChild(divMask);
        title.insertBefore(badge, title.firstChild);
        info.appendChild(title);
        info.appendChild(author);
        aMask.appendChild(info);
        a.appendChild(aMask);
        a.appendChild(overlay);
        div1.appendChild(img);
        div1.appendChild(a);
        df.appendChild(div1);
      });
      sidebar.innerHTML = "";
      sidebar.appendChild(df);
    })
    .catch((err) => console.log(err.message));
};

/**
 * Modals
 */
// Modal to confirm deleting a comment
const deleteModalElement = document.getElementById("deleteModal");
const deleteModal = new mdb.Modal(document.getElementById("deleteModal"), {});

deleteModalElement.addEventListener("show.mdb.modal", (event) => {
  const button = event.relatedTarget;
  const commentId = button.getAttribute("data-id");

  // update modal
  const deleteButton = deleteModalElement.querySelector("#delete");
  deleteButton.setAttribute("data-id", commentId);
});

// show Login modal
const loginModal = new mdb.Modal(document.getElementById("login"));
const showLoginModal = () => {
  loginModal.show();
};

// Get comments and the latest article (sidebar) when page is loaded
getComments(document.getElementById("getCommentsBtn"), 5);
getLatestArticles();
