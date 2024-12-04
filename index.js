const express = require("express");
const fs = require("fs");
const PriorityQueue = require("priorityqueuejs");
const app = express();
const port = 3002;

app.use(express.json());

// Initialize the priority queue (low priority -> high priority)
let complaintsQueue = new PriorityQueue((a, b) => a.priority - b.priority);

// Initialize a stack to store the history of resolved complaints
let resolutionHistory = [];

// Sample complaint structure
let complaints = [];

// Log file path for resolved complaints
const logFilePath = "./resolved_complaints.csv";

// Function to log resolved complaints to a CSV file
function logComplaintToFile(complaint) {
  const logData = `${complaint.timestamp}, ${complaint.description}, ${complaint.priority}, ${complaint.location}\n`;
  fs.appendFileSync(logFilePath, logData);
}

// POST endpoint to create a complaint
app.post("/complaints", (req, res) => {
  const { description, priority, location } = req.body;
  const complaint = { description, priority, location, timestamp: Date.now() };

  // Add to priority queue
  complaintsQueue.enq(complaint);
  complaints.push(complaint);

  res.status(201).json({ message: "Complaint received and added to the queue" });
});

// GET endpoint to view all complaints (sorted by priority)
app.get("/complaints", (req, res) => {
  const sortedComplaints = [];
  while (!complaintsQueue.isEmpty()) {
    sortedComplaints.push(complaintsQueue.deq());
  }

  res.json(sortedComplaints);
});

// POST endpoint to resolve a complaint
app.post("/resolve", (req, res) => {
  const { description } = req.body;

  // Find the complaint and mark it as resolved
  const complaintIndex = complaints.findIndex(c => c.description === description);
  if (complaintIndex !== -1) {
    const resolvedComplaint = complaints.splice(complaintIndex, 1)[0];
    resolutionHistory.push(resolvedComplaint);  // Push to stack for undo
    logComplaintToFile(resolvedComplaint);  // Log to CSV

    res.status(200).json({ message: "Complaint resolved and logged" });
  } else {
    res.status(404).json({ message: "Complaint not found" });
  }
});

// POST endpoint to undo the last resolved complaint
app.post("/undo", (req, res) => {
  if (resolutionHistory.length > 0) {
    const lastResolvedComplaint = resolutionHistory.pop();  // Undo the last resolution
    complaints.push(lastResolvedComplaint);  // Push it back to the queue

    res.status(200).json({ message: "Last resolution undone" });
  } else {
    res.status(404).json({ message: "No resolution to undo" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
