import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-4" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            홈으로
          </Button>
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl font-bold text-center">개인정보처리방침</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none p-6 md:p-8 space-y-6">
            <p className="text-sm text-muted-foreground text-center">시행일: 2025년 1월 1일</p>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">제1조 (목적)</h2>
              <p>
                붕따우 도깨비(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」을 준수하고 있습니다.
                본 개인정보처리방침은 회사가 제공하는 여행 견적 계산 및 관광 가이드 서비스(이하 "서비스")와 관련하여
                이용자의 개인정보가 어떻게 수집, 이용, 보관, 파기되는지에 대해 설명합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">제2조 (수집하는 개인정보 항목)</h2>
              <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>필수항목:</strong> 이름(닉네임), 이메일 주소, 프로필 이미지</li>
                <li><strong>선택항목:</strong> 성별 (카카오 로그인 시)</li>
                <li><strong>자동수집:</strong> 서비스 이용 기록, 접속 로그, IP 주소, 쿠키</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">제3조 (개인정보의 수집 방법)</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>카카오 로그인을 통한 OAuth 인증</li>
                <li>구글 로그인을 통한 OAuth 인증</li>
                <li>이메일/비밀번호를 통한 회원가입</li>
                <li>서비스 이용 과정에서 자동 수집</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">제4조 (개인정보의 이용 목적)</h2>
              <p>수집된 개인정보는 다음의 목적을 위해 이용됩니다:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>서비스 제공 및 회원 관리</li>
                <li>여행 견적서 저장 및 조회</li>
                <li>게시판 글 작성 및 댓글 서비스</li>
                <li>실시간 채팅 서비스</li>
                <li>서비스 개선 및 새로운 서비스 개발</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">제5조 (개인정보의 보유 및 이용 기간)</h2>
              <p>
                회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
                단, 관련 법령에 의해 보존할 필요가 있는 경우 아래와 같이 관련 법령에서 정한 기간 동안 개인정보를 보관합니다:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
                <li>접속에 관한 기록: 3개월</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">제6조 (개인정보의 제3자 제공)</h2>
              <p>
                회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
                다만, 아래의 경우에는 예외로 합니다:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">제7조 (이용자의 권리와 행사 방법)</h2>
              <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>개인정보 열람 요청</li>
                <li>오류 등이 있을 경우 정정 요청</li>
                <li>삭제 요청</li>
                <li>처리정지 요청</li>
              </ul>
              <p className="mt-2">
                위 권리 행사는 이메일(vungtau1004@daum.net)을 통해 요청하실 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">제8조 (개인정보의 파기)</h2>
              <p>
                회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는
                지체 없이 해당 개인정보를 파기합니다. 파기 절차 및 방법은 다음과 같습니다:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>파기절차:</strong> 불필요한 개인정보는 개인정보 관리책임자의 승인을 받아 파기합니다.</li>
                <li><strong>파기방법:</strong> 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없도록 기술적 방법을 사용하여 삭제합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">제9조 (쿠키의 운영)</h2>
              <p>
                회사는 이용자의 편의를 위해 쿠키를 운영합니다. 쿠키는 웹사이트가 이용자의 브라우저에
                전송하는 작은 텍스트 파일로, 이용자의 로그인 상태 유지 및 서비스 이용 기록 저장에 사용됩니다.
              </p>
              <p>이용자는 브라우저 설정을 통해 쿠키 사용을 거부할 수 있습니다.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">제10조 (개인정보 보호책임자)</h2>
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                <p><strong>개인정보 보호책임자</strong></p>
                <ul className="list-none space-y-1 mt-2">
                  <li>이름: 붕따우 도깨비 관리자</li>
                  <li>이메일: vungtau1004@daum.net</li>
                  <li>웹사이트: https://vungtau.blog</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold border-b pb-2">제11조 (개인정보처리방침의 변경)</h2>
              <p>
                이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가,
                삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>
            </section>

            <div className="text-center pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                본 개인정보처리방침은 2025년 1월 1일부터 시행됩니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
