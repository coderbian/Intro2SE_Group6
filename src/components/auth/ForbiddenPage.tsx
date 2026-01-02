import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";

interface ForbiddenPageProps {
  onGoHome?: () => void;
}

export function ForbiddenPage({ onGoHome }: ForbiddenPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-center text-2xl">403 - Forbidden</CardTitle>
          <CardDescription className="text-center">
            Bạn không có quyền truy cập trang này.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Nếu bạn nghĩ đây là lỗi, hãy liên hệ quản trị viên.
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={onGoHome}>Về trang chính</Button>
        </CardFooter>
      </Card>
    </div>
  );
}


