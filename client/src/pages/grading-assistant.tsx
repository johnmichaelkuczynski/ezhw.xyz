import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, Sparkles, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function GradingAssistant() {
  const { toast } = useToast();
  const [assignmentPrompt, setAssignmentPrompt] = useState('');
  const [gradingInstructions, setGradingInstructions] = useState('');
  const [studentSubmission, setStudentSubmission] = useState('');
  const [studentName, setStudentName] = useState('');
  const [gradingResult, setGradingResult] = useState<{
    grade: number;
    gradeText?: string;
    comments: string;
    feedback: string;
  } | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<string>('');

  const gradeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/grade-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentPrompt,
          gradingInstructions,
          studentSubmission
        })
      });
      
      if (!response.ok) {
        throw new Error('Grading failed');
      }
      
      return response.json() as Promise<{grade: number; gradeText?: string; comments: string; feedback: string}>;
    },
    onSuccess: (data) => {
      setGradingResult(data);
      toast({
        title: "Submission Graded",
        description: `Grade: ${data.grade}/100`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Grading Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const adjustGradeMutation = useMutation({
    mutationFn: async () => {
      if (!gradingResult) return null;
      
      const response = await fetch('/api/adjust-grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentPrompt,
          gradingInstructions,
          studentSubmission,
          currentGrade: gradingResult.grade,
          currentComments: gradingResult.comments,
          adjustmentType,
          studentName
        })
      });
      
      if (!response.ok) {
        throw new Error('Grade adjustment failed');
      }
      
      return response.json() as Promise<{grade: number; gradeText?: string; comments: string; feedback: string}>;
    },
    onSuccess: (data) => {
      if (data) {
        setGradingResult(data);
        toast({
          title: "Grade Adjusted",
          description: `New Grade: ${data.grade}/100`,
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Adjustment Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  const handleGrade = () => {
    if (!assignmentPrompt || !gradingInstructions || !studentSubmission) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all three sections before grading.",
      });
      return;
    }
    gradeMutation.mutate();
  };

  const handleAdjustGrade = () => {
    if (!adjustmentType) {
      toast({
        variant: "destructive",
        title: "No Adjustment Selected",
        description: "Please select an adjustment option.",
      });
      return;
    }
    adjustGradeMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
          <Sparkles className="inline-block w-8 h-8 mr-2 text-yellow-500" />
          Grading Assistant
        </h1>
        <p className="text-center text-gray-600 mb-8">AI-powered grading that follows YOUR rubric exactly</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Assignment Prompt */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-blue-900">Assignment Prompt</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setAssignmentPrompt('')}
                data-testid="button-clear-prompt"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 mb-3">Upload or enter the assignment instructions</p>
            <Textarea
              value={assignmentPrompt}
              onChange={(e) => setAssignmentPrompt(e.target.value)}
              placeholder="WRITE A 500 WORD ESSAY COMPARING FREUD AND MARX"
              className="min-h-[300px] bg-white"
              data-testid="textarea-assignment-prompt"
            />
          </Card>

          {/* Grading Instructions */}
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-yellow-900">Grading Instructions</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setGradingInstructions('')}
                data-testid="button-clear-instructions"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 mb-3">Upload or enter the grading criteria and rubric</p>
            <Textarea
              value={gradingInstructions}
              onChange={(e) => setGradingInstructions(e.target.value)}
              placeholder="A IF PERFECT; B IF PERFECT BUT DOES NOT INCLUDE QUOTES; C IF IMPERFECT; ETC"
              className="min-h-[300px] bg-white"
              data-testid="textarea-grading-instructions"
            />
          </Card>

          {/* Student Submission */}
          <Card className="p-6 bg-purple-50 border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-purple-900">Student Submission</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setStudentSubmission('')}
                data-testid="button-clear-submission"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 mb-3">Upload or enter the student's work</p>
            <Textarea
              value={studentSubmission}
              onChange={(e) => setStudentSubmission(e.target.value)}
              placeholder="Sigmund Freud and Karl Marx, two towering intellectual figures of the 19th and early 20th centuries..."
              className="min-h-[300px] bg-white"
              data-testid="textarea-student-submission"
            />
          </Card>
        </div>

        <div className="text-center mb-6">
          <Button
            onClick={handleGrade}
            disabled={gradeMutation.isPending}
            className="bg-cyan-500 hover:bg-cyan-600 text-white text-lg px-12 py-6"
            data-testid="button-grade-submission"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {gradeMutation.isPending ? 'Grading...' : 'GRADE SUBMISSION'}
          </Button>
        </div>

        {/* Grading Results */}
        {gradingResult && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Grading Results Panel */}
            <Card className="p-6 bg-green-50 border-green-200">
              <h2 className="text-xl font-semibold text-green-900 mb-4">Grading Results</h2>
              <p className="text-sm text-gray-600 mb-4">Edit feedback directly in the textbox below</p>
              
              <div className="mb-4">
                <Label htmlFor="student-name">Student Name</Label>
                <Input
                  id="student-name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter student name"
                  className="mt-1"
                  data-testid="input-student-name"
                />
              </div>

              <div className="bg-white rounded-lg p-6 text-center mb-4">
                <div className="text-5xl font-bold text-green-600 mb-2" data-testid="text-grade-value">
                  {gradingResult.gradeText || `${gradingResult.grade}/100`}
                </div>
                {gradingResult.gradeText && (
                  <div className="text-sm text-gray-500">({gradingResult.grade}/100 equivalent)</div>
                )}
              </div>

              <Textarea
                value={gradingResult.comments}
                onChange={(e) => setGradingResult({...gradingResult, comments: e.target.value})}
                className="min-h-[200px] bg-white mb-4"
                data-testid="textarea-grade-comments"
              />

              <Button
                variant="outline"
                className="w-full"
                data-testid="button-override-grade"
              >
                OVERRIDE GRADE
              </Button>
            </Card>

            {/* Professor Feedback & Grading Adjustment */}
            <Card className="p-6 bg-orange-50 border-orange-200">
              <h2 className="text-xl font-semibold text-orange-900 mb-2">Professor Feedback & Grading Adjustment</h2>
              <p className="text-sm text-gray-600 mb-4">Your feedback will generate new comments and a revised grade</p>

              <div className="mb-4">
                <Label className="text-sm font-semibold mb-2 block">Grade Adjustment</Label>
                <RadioGroup value={adjustmentType} onValueChange={setAdjustmentType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="reevaluate" id="reevaluate" data-testid="radio-reevaluate" />
                    <Label htmlFor="reevaluate" className="cursor-pointer">Re-evaluate completely</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="higher" id="higher" data-testid="radio-higher" />
                    <Label htmlFor="higher" className="cursor-pointer">Grade should be higher</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lower" id="lower" data-testid="radio-lower" />
                    <Label htmlFor="lower" className="cursor-pointer">Grade should be lower</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="appropriate" id="appropriate" data-testid="radio-appropriate" />
                    <Label htmlFor="appropriate" className="cursor-pointer">Grade is appropriate</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-gray-500 mt-2">Current grade: {gradingResult.grade}/100</p>
              </div>

              <div className="mb-4">
                <Label htmlFor="instructor-feedback">Instructor Feedback</Label>
                <Textarea
                  id="instructor-feedback"
                  value={gradingResult.feedback}
                  onChange={(e) => setGradingResult({...gradingResult, feedback: e.target.value})}
                  placeholder="IF THE STUDENT DOES EVERYTHING RIGHT AND DOES NOT MAKE ANY CLEAR MISTAKES, HE SHOULD GET A 100/100. DO NOT DEDUCT POINTS EXCEPT WHEN THEY ABSOLUTELY HAVE TO BE DEDUCTED."
                  className="min-h-[150px] bg-white"
                  data-testid="textarea-instructor-feedback"
                />
              </div>

              <Button
                onClick={handleAdjustGrade}
                disabled={adjustGradeMutation.isPending}
                className="w-full"
                data-testid="button-adjust-grade"
              >
                {adjustGradeMutation.isPending ? 'Adjusting...' : 'Apply Adjustment'}
              </Button>
            </Card>

            {/* Paper Improvement */}
            <Card className="p-6 bg-purple-50 border-purple-200">
              <h2 className="text-xl font-semibold text-purple-900 mb-2">Paper Improvement</h2>
              <p className="text-sm text-gray-600 mb-4">Create improved papers that will receive higher grades</p>

              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  This tool significantly enhances the student's submission to create a higher-quality paper that will earn better grades. It improves both content and structure while keeping the general topic.
                </p>
              </div>

              <div className="space-y-2">
                <Button className="w-full bg-purple-600 hover:bg-purple-700" data-testid="button-improve-paper">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Improve
                </Button>
                <Button variant="outline" className="w-full" data-testid="button-humanizer">
                  To Humanizer
                </Button>
                <Button variant="outline" className="w-full" data-testid="button-perfect-generator">
                  To Perfect Generator
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
