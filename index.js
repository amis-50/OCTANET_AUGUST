import express, { urlencoded } from "express";
import bodyParser from "body-parser";
import mongoose, { SchemaTypes } from "mongoose";

const app = express();
mongoose.connect("mongodb+srv://admin-Harshal:atlas123@cluster0.7yhjsgh.mongodb.net/todoDB");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
const todoSchema = new mongoose.Schema({
  name: String,
  deadline: String,
  time: String,
  days: Number,
});

const Todo = mongoose.model("todo", todoSchema);

const todo1 = new Todo({
  name: "Welcome to your ToDo List",
});
const todo2 = new Todo({
  name: "Hit the Add button to add new item",
});
const todo3 = new Todo({
  name: "<---- Hit this to delete an item",
});
const defaultItems = [todo1, todo2, todo3];

const listSchema = new mongoose.Schema({
  name: String,
  listItems: [todoSchema],
});

const List = mongoose.model("List", listSchema);



app.get("/", (req, res) => {
  Todo.find()
    .sort({ days: 1 })
    .then((result) => {
      if (result.length === 0) {
        // Check if default items are already present
        Todo.findOne({ name: "Welcome to your ToDo List" }).then((existingItem) => {
          if (!existingItem) {
            Todo.insertMany(defaultItems)
              .then(() => {
                console.log("Default data saved!!");
              })
              .catch((err) => {
                console.log(err);
              });
          }
          res.redirect("/");
        });
      } else {
        res.render("index.ejs", {
          array: result,
          date: "Today",
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});


app.post("/", (req, res) => {
  const newTask = req.body.task;
  const newDeadLine = req.body.deadline;
  const newTime = req.body.time;
  const listName = req.body.list;
  const today = new Date(); // Current date and time
  const otherDate = new Date(newDeadLine); // Another date
  const timeDifferenceMs = otherDate - today;
  const daysDifference = Math.floor(timeDifferenceMs / (1000 * 60 * 60 * 24));
  const newTodo = new Todo({
    name: newTask,
    deadline: newDeadLine,
    time: newTime,
    days: daysDifference,
  });
  if (listName === "Today") {
    newTodo.save();
    res.redirect("/");
  } else {
    List.findOne({name : listName}).then((foundList)=>{
      foundList.listItems.push(newTodo);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function (req, res) {
  const checktId = req.body.chkBox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Todo.findByIdAndRemove(checktId)
    .then(() => {
      console.log(`Item with id ${checktId} is removed.`);
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
  } else {
    Todo.findOneAndUpdate({name : listName}, {$pull: {listItems : {_id : checktId}}}).then((foundList)=>{
      res.redirect("/"+listName);
    }).catch((err)=>{
      console.log(err);
    });
  }

  
});

app.get("/:customListName", (req, res) => {
  const customListName = req.params.customListName;

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (!foundList) {
        if (customListName !== "favicon.ico") { 
          const list = new List({
            name: customListName,
            listItems: defaultItems,
          });
          list.save();
        }
        res.redirect("/" + customListName);
      } else {
        res.render("index.ejs", {
          date: foundList.name,
          array: foundList.listItems,
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.listen(3000, () => {
  console.log("Project running on port 3000");
});

