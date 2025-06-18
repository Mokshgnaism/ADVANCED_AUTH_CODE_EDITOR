import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";
import { useParams } from "react-router-dom";
import InviteFriends from "../components/InviteFriends"; // make sure the path is correct
import { UserPlus } from "lucide-react"; // or any icon you like
import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import axios from "axios";
const socket = io("http://localhost:5000");

export default function RoomPage() {
  const { id: roomId } = useParams();
  const [code, setCode] = useState(null);
  const [showInviteBox, setShowInviteBox] = useState(false);
  const editorRef = useRef(null);
  const skipEmitRef = useRef(false);
  const [input, setInput] = useState("");
  const [output, setoutput] = useState("");

  const {
  mutateAsync: getOutput,
  isPending: isGettingOutput,
} = useMutation({
  mutationFn: async () => {
    const response = await axios.get(`http://localhost:5010/output/${roomId}`);
    return response.data.output;
  }
});

  const { mutate: runCode, isPending: isRunning } = useMutation({
    mutationFn: async () => {
      console.log("trying run code;;;");
      const response = await axios.post("http://localhost:5010/submit-code", {
        "roomId": roomId,
        "language": "cpp",
        code,
        input
      })
      console.log("finished getting it ...")
      return response.data;//just for fun...
    },
    onSuccess: async () => {
      const maxAttempts = 10;
      let attempts = 0;
      let output = "";

      while (attempts < maxAttempts) {
        await new Promise((res) => setTimeout(res, 1000)); // wait 1 sec
        try {
          const response = await getOutput(); // using mutateAsync from useMutation
          if (response && response.trim() !== "") {
            output = response;
            break;
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
        attempts++;
      }
      if (output) {
        setoutput(output);
      } else {
        setoutput("Timed out. No output received.");
      }
    }
  })





  useEffect(() => {
    socket.emit("join-room", roomId);

    socket.on("code-update", ({ code: newCode }) => {
      const editor = editorRef.current;
      setCode(newCode);

      if (editor && editor.getValue() !== newCode) {
        skipEmitRef.current = true;
        editor.setValue(newCode);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;

    editor.onDidChangeModelContent(() => {
      if (skipEmitRef.current) {
        skipEmitRef.current = false;
        return;
      }
      const updatedCode = editor.getValue();
      setCode(updatedCode);
      socket.emit("code-change", { roomId, code: updatedCode });
    });
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Code Editor */}
    {/* Code Editor */}
<div className="flex-1">
  <Editor
    height="100%"
    defaultLanguage="cpp"
    value={code ?? "// Loading..."}
    theme="vs-dark"
    onMount={handleEditorMount}
  />
</div>

{/* Input & Output Section */}
<div className="bg-gray-100 dark:bg-gray-800 p-4 border-t">
  <div className="flex flex-col md:flex-row gap-4">
    {/* Input */}
    <div className="flex-1">
      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
        Input
      </label>
      <textarea
        className="w-full h-24 p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-white"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter input here"
      />
    </div>

    {/* Run Button */}
    <div className="flex items-end justify-center">
      <button
        onClick={runCode}
        className="btn btn-primary"
        disabled={isRunning}
      >
        {isRunning ? "Running..." : "Run"}
      </button>
    </div>

    {/* Output */}
    <div className="flex-1">
      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
        Output
      </label>
      <textarea
        className="w-full h-24 p-2 border rounded-md bg-gray-100 dark:bg-gray-900 dark:text-white"
        value={output}
        readOnly
        placeholder="Program output will appear here"
      />
    </div>
  </div>
</div>


      
      

    </div>
  );
}
