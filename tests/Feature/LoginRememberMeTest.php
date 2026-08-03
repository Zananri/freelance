<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Auth;
use Mockery;
use Tests\TestCase;

class LoginRememberMeTest extends TestCase
{
    public function test_login_can_set_remember_me_cookie(): void
    {
        $user = new \stdClass();
        $user->id = 1;
        $user->email = 'user@example.com';

        Auth::shouldReceive('attempt')
            ->once()
            ->with(['email' => 'user@example.com', 'password' => 'secret123'], true)
            ->andReturn(true);

        Auth::shouldReceive('user')
            ->once()
            ->andReturn($user);
        Auth::shouldReceive('guard')
            ->andReturnSelf();
        Auth::shouldReceive('check')
            ->andReturn(false);

        $employeeModel = Mockery::mock('alias:App\\Models\\Employee');
        $employeeModel->shouldReceive('where')
            ->once()
            ->with('user_id', 1)
            ->andReturnSelf();
        $employeeModel->shouldReceive('first')
            ->once()
            ->andReturn((object) ['id' => 10]);

        $userAuthLogModel = Mockery::mock('alias:App\\Models\\UserAuthLog');
        $userAuthLogModel->shouldReceive('create')
            ->once()
            ->andReturn(true);

        $response = $this->post('/login', [
            'email' => 'user@example.com',
            'password' => 'secret123',
            'remember' => 'on',
        ]);

        $response->assertRedirect('/dashboard');
    }
}
