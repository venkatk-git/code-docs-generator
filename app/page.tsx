"use client"

import { useState, type ChangeEvent, type FormEvent } from "react"
import OpenAI from "openai"
import ReactMarkdown from "react-markdown"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, FileCode, FileUp, FileText, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CodeToDocs() {
  const [codeInput, setCodeInput] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [result, setResult] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("paste")

  // Initialize OpenAI client
  const openai = new OpenAI({
    baseURL: "https://api.aimlapi.com/v1",
    apiKey: "d7f3594e56b449bbaaa51453c2aa4a8e",
    dangerouslyAllowBrowser: true,
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!codeInput.trim()) {
      setError("Please enter some code")
      return
    }

    try {
      setLoading(true)
      setError("")

      const completion = await openai.chat.completions.create({
        model: "meta-llama/Llama-3-8b-chat-hf",
        messages: [
          {
            role: "system",
            content: "Generate detailed markdown documentation including functions, parameters, returns, and examples.",
          },
          {
            role: "user",
            content: `Please document this code:\n\n${codeInput}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      })

      if (completion.choices[0]?.message?.content) {
        setResult(completion.choices[0].message.content)
      } else {
        throw new Error("No documentation generated")
      }
    } catch (err: any) {
      setError(`Error: ${err.error?.message || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (event.target?.result) {
        setCodeInput(event.target.result as string)
      }
    }
    reader.readAsText(file)
  }

  const handleDownload = () => {
    if (!result) return

    // Create a blob from the markdown content
    const blob = new Blob([result], { type: "text/markdown" })

    // Create a temporary anchor element
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url

    // Generate filename based on current date or use a default name
    const filename = `documentation-${new Date().toISOString().split("T")[0]}.md`
    a.download = filename

    // Trigger download
    document.body.appendChild(a)
    a.click()

    // Cleanup
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-medium tracking-tight">Code Documentation Generator</h1>
          <p className="text-sm text-gray-500">Transform your code into comprehensive documentation with AI</p>
        </div>

        <Card className="border border-gray-200 shadow-sm rounded-lg overflow-hidden">
          <CardHeader className="px-6 py-5 border-b border-gray-100 bg-white">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Input Code
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="paste" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b border-gray-100">
                  <TabsList className="h-12 w-full rounded-none bg-gray-50 p-0">
                    <TabsTrigger
                      value="paste"
                      className="flex-1 h-full data-[state=active]:bg-white data-[state=active]:shadow-none rounded-none border-r border-gray-100"
                    >
                      <span className="flex items-center gap-2">
                        <FileCode className="h-4 w-4" />
                        Paste Code
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="upload"
                      className="flex-1 h-full data-[state=active]:bg-white data-[state=active]:shadow-none rounded-none"
                    >
                      <span className="flex items-center gap-2">
                        <FileUp className="h-4 w-4" />
                        Upload File
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="paste" className="mt-0">
                  <Textarea
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="Paste your code here..."
                    className="font-mono h-80 resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </TabsContent>

                <TabsContent value="upload" className="mt-0 p-0">
                  <div className="border-0 p-10 text-center bg-white h-80 flex items-center justify-center">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".js,.jsx,.ts,.tsx,.py,.java,.html,.css"
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <FileUp className="h-5 w-5 text-gray-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Click to upload a code file</p>
                        <p className="text-xs text-gray-500">Supports .js, .jsx, .ts, .tsx, .py, .java, .html, .css</p>
                        {codeInput && activeTab === "upload" && (
                          <p className="mt-2 text-xs font-medium text-green-600">File loaded successfully!</p>
                        )}
                      </div>
                    </label>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="p-4 bg-gray-50 border-t border-gray-100">
                {error && (
                  <Alert variant="destructive" className="mb-4 bg-red-50 text-red-700 border-red-200">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={loading || !codeInput.trim()}
                  className="w-full bg-black hover:bg-gray-800 text-white"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating Documentation...
                    </span>
                  ) : (
                    "Generate Documentation"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {(result || loading) && (
          <Card className="border border-gray-200 shadow-sm rounded-lg overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-gray-100 bg-white flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Generated Documentation
              </CardTitle>
              {result && !loading && (
                <Button variant="outline" size="sm" onClick={handleDownload} className="h-8 gap-1 text-xs">
                  <Download className="h-3.5 w-3.5" />
                  Download MD
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center items-center h-60 bg-white">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <p className="text-sm text-gray-500">Generating documentation...</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-white">
                  <div className="prose prose-gray max-w-none">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-center text-gray-400">
          Powered by AI - Documentation is generated based on the provided code
        </p>
      </div>
    </div>
  )
}

