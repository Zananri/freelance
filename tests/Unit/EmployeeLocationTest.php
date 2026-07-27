<?php

namespace Tests\Unit;

use App\Models\EmployeeLocation;
use Carbon\Carbon;
use Tests\TestCase;

class EmployeeLocationTest extends TestCase
{
    public function test_tracked_at_is_cast_to_a_datetime(): void
    {
        $location = new EmployeeLocation();
        $location->setRawAttributes([
            'latitude' => '-6.2000000',
            'longitude' => '106.8166667',
            'accuracy' => '12.50',
            'tracked_at' => '2026-07-28 10:30:00',
        ]);

        $this->assertInstanceOf(Carbon::class, $location->tracked_at);
        $this->assertSame(-6.2, $location->latitude);
        $this->assertSame(106.8166667, $location->longitude);
        $this->assertSame(12.5, $location->accuracy);
    }
}
